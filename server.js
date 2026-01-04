import express from 'express'
import cors from 'cors'
import axios from 'axios'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())

const apiKey = process.env.JQUANTS_API_KEY
const headers = { 'x-api-key': apiKey }

// キャッシュ
let cache = {
  data: null,
  timestamp: 0
}
const CACHE_TTL = 5 * 60 * 1000 // 5分

async function getLatestPrices() {
  for (let i = 1; i <= 5; i++) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '')
    
    try {
      const res = await axios.get('https://api.jquants.com/v2/equities/bars/daily', {
        headers,
        params: { date: dateStr }
      })
      const prices = res.data.data || []
      if (prices.length > 0) {
        console.log(`株価: ${prices.length}件取得 (${dateStr})`)
        return prices
      }
    } catch (e) {
      // skip
    }
  }
  return []
}

async function getFinancials(codes) {
  const finData = {}
  const targetCodes = codes.slice(0, 30) // 30銘柄
  
  console.log(`財務データ取得中... (${targetCodes.length}銘柄)`)
  
  for (const code of targetCodes) {
    try {
      const res = await axios.get('https://api.jquants.com/v2/fins/summary', {
        headers,
        params: { code }
      })
      const data = res.data.data || []
      if (data.length > 0) {
        const latest = data[data.length - 1]
        finData[code] = latest
      }
      // レート制限対策：少し待つ
      await new Promise(r => setTimeout(r, 100))
    } catch (e) {
      if (e.response?.status === 429) {
        console.log('レート制限。少し待機...')
        await new Promise(r => setTimeout(r, 2000))
      }
    }
  }
  
  console.log(`財務データ: ${Object.keys(finData).length}件取得`)
  return finData
}

app.get('/api/screening', async (req, res) => {
  try {
    // キャッシュがあれば返す
    if (cache.data && Date.now() - cache.timestamp < CACHE_TTL) {
      console.log('キャッシュから返却')
      return res.json(cache.data)
    }
    
    console.log('データ取得開始...')
    
    // 銘柄マスター
    const masterRes = await axios.get('https://api.jquants.com/v2/equities/master', { headers })
    const stocks = masterRes.data.data || []
    const filtered = stocks.filter(s => s.Mkt === '0111' || s.Mkt === '0112')
    console.log(`銘柄: ${filtered.length}件`)
    
    // 株価
    const prices = await getLatestPrices()
    const priceData = {}
    prices.forEach(p => {
      priceData[p.Code] = { price: p.AdjC || p.C }
    })
    
    // 財務情報
    const codes = filtered.slice(0, 200).map(s => s.Code)
    const finData = await getFinancials(codes)
    
    // 結果をマッピング
    const result = filtered.slice(0, 200).map(s => {
      const price = priceData[s.Code]?.price
      const fin = finData[s.Code] || {}
      
      const eps = parseFloat(fin.FEPS) || parseFloat(fin.EPS) || null
      const bps = parseFloat(fin.BPS) || null
      const dividend = parseFloat(fin.FDivAnn) || parseFloat(fin.DivAnn) || null
      const shares = parseFloat(fin.ShOutFY) || null
      const equity = parseFloat(fin.Eq) || null
      const totalAssets = parseFloat(fin.TA) || null
      const netIncome = parseFloat(fin.FNI) || parseFloat(fin.NI) || null
      
      let per = null
      if (price && eps && eps > 0) {
        per = price / eps
      }
      
      let pbr = null
      if (price && bps && bps > 0) {
        pbr = price / bps
      } else if (price && equity && shares) {
        const calcBps = equity / shares
        if (calcBps > 0) {
          pbr = price / calcBps
        }
      }
      
      let dividendYield = null
      if (price && dividend && dividend > 0) {
        dividendYield = (dividend / price) * 100
      }
      
      let marketCap = null
      if (price && shares) {
        marketCap = price * shares
      }
      
      // ROE (自己資本利益率) = 当期純利益 / 自己資本 * 100
      let roe = null
      if (netIncome && equity && equity > 0) {
        roe = (netIncome / equity) * 100
      }
      
      // ROA (総資産利益率) = 当期純利益 / 総資産 * 100
      let roa = null
      if (netIncome && totalAssets && totalAssets > 0) {
        roa = (netIncome / totalAssets) * 100
      }
      
      // 自己資本比率 = 自己資本 / 総資産 * 100
      let equityRatio = null
      if (equity && totalAssets && totalAssets > 0) {
        equityRatio = (equity / totalAssets) * 100
      }
      
      return {
        code: s.Code.slice(0, 4),
        name: s.CoName,
        sector: s.S33Nm || '不明',
        market: s.MktNm || '',
        price: price || null,
        per: per,
        pbr: pbr,
        dividendYield: dividendYield,
        marketCap: marketCap,
        roe: roe,
        roa: roa,
        equityRatio: equityRatio,
        // 詳細情報用の追加データ
        eps: eps,
        bps: bps,
        dividend: dividend,
        netIncome: netIncome,
        equity: equity,
        totalAssets: totalAssets,
        shares: shares
      }
    })
    
    const withPer = result.filter(r => r.per).length
    console.log(`PERあり: ${withPer}件`)
    
    // キャッシュに保存
    const response = { stocks: result, total: filtered.length }
    cache = { data: response, timestamp: Date.now() }
    
    res.json(response)
  } catch (error) {
    console.error('エラー:', error.response?.status, error.response?.data)
    res.status(500).json({ error: error.message })
  }
})

// server.jsに以下を追加

// 株価チャートデータ取得エンドポイント
app.get('/api/chart/:code', async (req, res) => {
  try {
    const { code } = req.params
    const { period = '1M' } = req.query // 1D, 1W, 1M, 3M, 6M, 1Y, 3Y, 5Y
    
    // 期間に応じた日数を計算
    const periodDays = {
      '1D': 1,
      '1W': 7,
      '1M': 30,
      '3M': 90,
      '6M': 180,
      '1Y': 365,
      '3Y': 1095,
      '5Y': 1825
    }
    
    const days = periodDays[period] || 30
    
    // 終了日（今日）
    const endDate = new Date()
    const endDateStr = endDate.toISOString().split('T')[0].replace(/-/g, '')
    
    // 開始日
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    const startDateStr = startDate.toISOString().split('T')[0].replace(/-/g, '')
    
    console.log(`チャートデータ取得: ${code} (${period}: ${startDateStr} ~ ${endDateStr})`)
    
    // J-Quants APIから日次株価データを取得
    const response = await axios.get('https://api.jquants.com/v2/equities/bars/daily', {
      headers,
      params: {
        code: code,
        from: startDateStr,
        to: endDateStr
      }
    })
    
    const data = response.data.data || []
    
    // チャート用にデータを整形
    const chartData = data.map(item => ({
      date: item.Date,
      open: item.O,
      high: item.H,
      low: item.L,
      close: item.C,
      volume: item.V,
      adjustedClose: item.AdjC || item.C
    })).sort((a, b) => a.date.localeCompare(b.date))
    
    console.log(`チャートデータ: ${chartData.length}件取得`)
    
    res.json({
      code: code,
      period: period,
      data: chartData
    })
    
  } catch (error) {
    console.error('チャートデータ取得エラー:', error.response?.status, error.response?.data)
    res.status(500).json({ error: error.message })
  }
})


// 財務データ推移取得エンドポイント
app.get('/api/financials/:code', async (req, res) => {
  try {
    const { code } = req.params
    
    console.log(`財務データ取得: ${code}`)
    
    const response = await axios.get('https://api.jquants.com/v2/fins/summary', {
      headers,
      params: { code: code }
    })
    
    const data = response.data.data || []
    
    const financials = data
      .filter(item => item.FY)
      .sort((a, b) => a.FY.localeCompare(b.FY))
      .slice(-5)
      .map(item => ({
        fiscalYear: item.FY,
        revenue: parseFloat(item.Sales) || 0,
        operatingIncome: parseFloat(item.OI) || 0,
        ordinaryIncome: parseFloat(item.RP) || 0,
        netIncome: parseFloat(item.NI) || 0,
      }))
    
    console.log(`財務データ: ${financials.length}年分取得`)
    
    res.json({
      code: code,
      data: financials
    })
    
  } catch (error) {
    console.error('財務データ取得エラー:', error.response?.status, error.response?.data)
    res.status(500).json({ error: error.message })
  }
})

// 静的ファイルの配信
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Viteのビルド成果物を配信
app.use(express.static(path.join(__dirname, 'dist')))

// API以外のすべてのルートでindex.htmlを返す
app.use((req, res, next) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'))
  } else {
    next()
  }
})

const PORT = 3001

app.listen(PORT, () => {
  console.log(`APIサーバー起動: http://localhost:${PORT}`)
  console.log('※データは5分間キャッシュされます')
})
