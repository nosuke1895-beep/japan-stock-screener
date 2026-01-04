

import { useState, useMemo, useEffect } from 'react'
import './App.css'
import { useJQuantsAPI, getAPIStatusMessage } from './useJQuantsAPI'
import StockChart from './StockChart'
import FinancialChart from './FinancialChart'

function App() {
  const { stocks: apiStocks, loading, error, fetchScreenerData } = useJQuantsAPI()

  const [darkMode, setDarkMode] = useState(() => JSON.parse(localStorage.getItem('darkMode') ?? 'true'))
  const [favorites, setFavorites] = useState(() => JSON.parse(localStorage.getItem('favorites') ?? '[]'))
  const [savedFilters, setSavedFilters] = useState(() => JSON.parse(localStorage.getItem('savedFilters') ?? '[]'))
  
  const [filters, setFilters] = useState({
    priceMin: '', priceMax: '', perMin: '', perMax: '', pbrMin: '', pbrMax: '',
    dividendYieldMin: '', dividendYieldMax: '', marketCapMin: '', marketCapMax: '',
    roeMin: '', roeMax: '', roaMin: '', roaMax: '', equityRatioMin: '', equityRatioMax: '',
    sector: '', searchCode: '', searchName: '', favoritesOnly: false,
  })

  const [selectedStock, setSelectedStock] = useState(null)
  const [showRanking, setShowRanking] = useState(false)
  const [showSaveFilter, setShowSaveFilter] = useState(false)
  const [filterName, setFilterName] = useState('')
  const [sortConfig, setSortConfig] = useState({ key: 'code', direction: 'asc' })

  useEffect(() => { fetchScreenerData() }, [fetchScreenerData])
  useEffect(() => {
    document.body.classList.toggle('light-mode', !darkMode)
    localStorage.setItem('darkMode', JSON.stringify(darkMode))
  }, [darkMode])
  useEffect(() => { localStorage.setItem('favorites', JSON.stringify(favorites)) }, [favorites])

  const toggleFavorite = (code, e) => {
    e?.stopPropagation()
    setFavorites(prev => prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code])
  }

  const sectors = useMemo(() => [...new Set(apiStocks.map(s => s.sector))].filter(Boolean).sort(), [apiStocks])

  const calculateValueScore = (stock) => {
    let score = 0
    if (stock.per > 0 && stock.per < 10) score += 3
    else if (stock.per < 15) score += 2
    else if (stock.per < 20) score += 1
    if (stock.pbr > 0 && stock.pbr < 1) score += 3
    else if (stock.pbr < 1.5) score += 2
    else if (stock.pbr < 2) score += 1
    if (stock.dividendYield >= 4) score += 3
    else if (stock.dividendYield >= 3) score += 2
    else if (stock.dividendYield >= 2) score += 1
    if (stock.roe >= 15) score += 2
    else if (stock.roe >= 10) score += 1
    if (stock.equityRatio >= 50) score += 2
    else if (stock.equityRatio >= 40) score += 1
    return score
  }

  const filteredStocks = useMemo(() => apiStocks.filter(stock => {
    const f = filters
    if (f.favoritesOnly && !favorites.includes(stock.code)) return false
    if (f.searchCode && !stock.code.includes(f.searchCode.toUpperCase())) return false
    if (f.searchName && !stock.name.includes(f.searchName)) return false
    if (f.priceMin && stock.price < Number(f.priceMin)) return false
    if (f.priceMax && stock.price > Number(f.priceMax)) return false
    if (f.perMin && stock.per < Number(f.perMin)) return false
    if (f.perMax && stock.per > Number(f.perMax)) return false
    if (f.pbrMin && stock.pbr < Number(f.pbrMin)) return false
    if (f.pbrMax && stock.pbr > Number(f.pbrMax)) return false
    if (f.dividendYieldMin && stock.dividendYield < Number(f.dividendYieldMin)) return false
    if (f.dividendYieldMax && stock.dividendYield > Number(f.dividendYieldMax)) return false
    if (f.marketCapMin && stock.marketCap < Number(f.marketCapMin) * 1000000) return false
    if (f.marketCapMax && stock.marketCap > Number(f.marketCapMax) * 1000000) return false
    if (f.roeMin && stock.roe < Number(f.roeMin)) return false
    if (f.roeMax && stock.roe > Number(f.roeMax)) return false
    if (f.roaMin && stock.roa < Number(f.roaMin)) return false
    if (f.roaMax && stock.roa > Number(f.roaMax)) return false
    if (f.equityRatioMin && stock.equityRatio < Number(f.equityRatioMin)) return false
    if (f.equityRatioMax && stock.equityRatio > Number(f.equityRatioMax)) return false
    if (f.sector && stock.sector !== f.sector) return false
    return true
  }), [apiStocks, filters, favorites])

  const stocksWithScore = useMemo(() => 
    filteredStocks.map(stock => ({ ...stock, valueScore: calculateValueScore(stock) })),
    [filteredStocks]
  )

  const sortedStocks = useMemo(() => {
    const sorted = [...stocksWithScore]
    sorted.sort((a, b) => {
      const aVal = a[sortConfig.key], bVal = b[sortConfig.key]
      if (aVal == null) return 1
      if (bVal == null) return -1
      return (aVal < bVal ? -1 : aVal > bVal ? 1 : 0) * (sortConfig.direction === 'asc' ? 1 : -1)
    })
    return sorted
  }, [stocksWithScore, sortConfig])

  const rankings = useMemo(() => {
    const valid = apiStocks.filter(s => s.per > 0 || s.pbr > 0 || s.dividendYield > 0)
    return {
      per: [...valid].filter(s => s.per > 0).sort((a, b) => a.per - b.per).slice(0, 10),
      pbr: [...valid].filter(s => s.pbr > 0).sort((a, b) => a.pbr - b.pbr).slice(0, 10),
      dividend: [...valid].filter(s => s.dividendYield > 0).sort((a, b) => b.dividendYield - a.dividendYield).slice(0, 10),
      roe: [...valid].filter(s => s.roe > 0).sort((a, b) => b.roe - a.roe).slice(0, 10),
      valueScore: [...stocksWithScore].sort((a, b) => b.valueScore - a.valueScore).slice(0, 10)
    }
  }, [apiStocks, stocksWithScore])

  const handleSort = (key) => setSortConfig(prev => ({
    key, direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
  }))

  const resetFilters = () => setFilters({
    priceMin: '', priceMax: '', perMin: '', perMax: '', pbrMin: '', pbrMax: '',
    dividendYieldMin: '', dividendYieldMax: '', marketCapMin: '', marketCapMax: '',
    roeMin: '', roeMax: '', roaMin: '', roaMax: '', equityRatioMin: '', equityRatioMax: '',
    sector: '', searchCode: '', searchName: '', favoritesOnly: false,
  })

  const saveCurrentFilter = () => {
    if (!filterName.trim()) return
    const updated = [...savedFilters, { id: Date.now(), name: filterName, filters: { ...filters } }]
    setSavedFilters(updated)
    localStorage.setItem('savedFilters', JSON.stringify(updated))
    setShowSaveFilter(false)
    setFilterName('')
  }

  const loadFilter = (filter) => setFilters(filter.filters)
  
  const deleteFilter = (id) => {
    const updated = savedFilters.filter(f => f.id !== id)
    setSavedFilters(updated)
    localStorage.setItem('savedFilters', JSON.stringify(updated))
  }

  const exportToCSV = () => {
    const headers = ['コード', '銘柄名', 'セクター', '株価', 'PER', 'PBR', '配当利回り', 'ROE', 'ROA', '自己資本比率', '時価総額', '割安度スコア']
    const rows = sortedStocks.map(s => [s.code, s.name, s.sector, s.price||'', s.per||'', s.pbr||'', s.dividendYield||'', s.roe||'', s.roa||'', s.equityRatio||'', s.marketCap||'', s.valueScore||''])
    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `stock-screener-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
  }

  const formatMarketCap = (v) => !v ? "-" : `${(v/100).toFixed(0)}億円`
  const formatNumber = (v, d=1) => v == null ? '-' : v.toFixed(d)

  const SortIndicator = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) return <span className="sort-indicator">⇅</span>
    return <span className="sort-indicator active">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
  }

  const ScoreBadge = ({ score }) => {
    let cls = 'score-badge'
    if (score >= 10) cls += ' excellent'
    else if (score >= 7) cls += ' good'
    else if (score >= 4) cls += ' fair'
    return <span className={cls}>{score}</span>
  }

  const StockDetailModal = ({ stock, onClose }) => !stock ? null : (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{stock.code} - {stock.name}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="detail-section">
            <h3>基本情報</h3>
            <div className="detail-grid">
              <div className="detail-item"><span className="detail-label">セクター</span><span className="detail-value">{stock.sector}</span></div>
              <div className="detail-item"><span className="detail-label">市場</span><span className="detail-value">{stock.market}</span></div>
              <div className="detail-item"><span className="detail-label">株価</span><span className="detail-value">¥{stock.price?.toLocaleString() || '-'}</span></div>
              <div className="detail-item"><span className="detail-label">時価総額</span><span className="detail-value">{formatMarketCap(stock.marketCap)}</span></div>
            </div>
          </div>
          <div className="detail-section">
            <h3>バリュエーション</h3>
            <div className="detail-grid">
              <div className="detail-item"><span className="detail-label">PER</span><span className="detail-value">{formatNumber(stock.per)}倍</span></div>
              <div className="detail-item"><span className="detail-label">PBR</span><span className="detail-value">{formatNumber(stock.pbr,2)}倍</span></div>
              <div className="detail-item"><span className="detail-label">EPS</span><span className="detail-value">¥{formatNumber(stock.eps,2)}</span></div>
              <div className="detail-item"><span className="detail-label">BPS</span><span className="detail-value">¥{formatNumber(stock.bps,2)}</span></div>
            </div>
          </div>
          <div className="detail-section">
            <h3>配当</h3>
            <div className="detail-grid">
              <div className="detail-item"><span className="detail-label">配当利回り</span><span className="detail-value">{formatNumber(stock.dividendYield)}%</span></div>
              <div className="detail-item"><span className="detail-label">配当金</span><span className="detail-value">¥{formatNumber(stock.dividend,2)}</span></div>
            </div>
          </div>
          <div className="detail-section">
            <h3>収益性指標</h3>
            <div className="detail-grid">
              <div className="detail-item"><span className="detail-label">ROE（自己資本利益率）</span><span className="detail-value">{formatNumber(stock.roe)}%</span></div>
              <div className="detail-item"><span className="detail-label">ROA（総資産利益率）</span><span className="detail-value">{formatNumber(stock.roa)}%</span></div>
              <div className="detail-item"><span className="detail-label">割安度スコア</span><span className="detail-value"><ScoreBadge score={stock.valueScore} /></span></div>
            </div>
          </div>
          <div className="detail-section">
            <h3>財務健全性</h3>
            <div className="detail-grid">
              <div className="detail-item"><span className="detail-label">自己資本比率</span><span className="detail-value">{formatNumber(stock.equityRatio)}%</span></div>
              <div className="detail-item"><span className="detail-label">自己資本</span><span className="detail-value">{stock.equity ? `${(stock.equity/100000000).toFixed(0)}億円` : '-'}</span></div>
              <div className="detail-item"><span className="detail-label">総資産</span><span className="detail-value">{stock.totalAssets ? `${(stock.totalAssets/100000000).toFixed(0)}億円` : '-'}</span></div>
              <div className="detail-item"><span className="detail-label">当期純利益</span><span className="detail-value">{stock.netIncome ? `${(stock.netIncome/100000000).toFixed(0)}億円` : '-'}</span></div>
            </div>
          </div>
　　　　　　<StockChart code={stock.code} />
            <FinancialChart code={stock.code} />
        </div>
      </div>
    </div>
  )

  const RankingModal = ({ onClose }) => (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content ranking-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>📊 ランキング TOP10</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {[
            { title: '割安度スコア', data: rankings.valueScore, key: 'valueScore', format: v => <ScoreBadge score={v} /> },
            { title: 'PER（低い順）', data: rankings.per, key: 'per', format: v => `${v.toFixed(1)}倍` },
            { title: 'PBR（低い順）', data: rankings.pbr, key: 'pbr', format: v => `${v.toFixed(2)}倍` },
            { title: '配当利回り（高い順）', data: rankings.dividend, key: 'dividendYield', format: v => `${v.toFixed(1)}%` },
            { title: 'ROE（高い順）', data: rankings.roe, key: 'roe', format: v => `${v.toFixed(1)}%` }
          ].map(({ title, data, key, format }) => (
            <div className="ranking-section" key={title}>
              <h3>{title}</h3>
              <div className="ranking-list">
                {data.map((stock, i) => (
                  <div className="ranking-item" key={stock.code} onClick={() => { setSelectedStock(stock); setShowRanking(false) }}>
                    <span className="rank">{i+1}</span>
                    <span className="stock-info"><span className="code">{stock.code}</span><span className="name">{stock.name}</span></span>
                    <span className="value">{format(stock[key])}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <div className="header-left">
            <h1>📈 日本株スクリーナー</h1>
            <p className="subtitle">割安株を見つけよう</p>
          </div>
          <div className="header-actions">
            <button onClick={() => setShowRanking(true)} className="btn-secondary">📊 ランキング</button>
            <button onClick={exportToCSV} className="btn-secondary">📥 CSV出力</button>
            <button onClick={() => { fetchScreenerData(); }} className="btn-secondary">🔄 更新</button>
            <button onClick={() => setDarkMode(p => !p)} className="btn-icon" title="テーマ切替">{darkMode ? '☀️' : '🌙'}</button>
          </div>
        </div>
      </header>

      <div className="container">
        <aside className="filter-panel">
          <div className="filter-header">
            <h2>フィルター</h2>
            <div className="filter-header-actions">
              <button className="btn-text" onClick={() => setShowSaveFilter(true)}>💾 保存</button>
              <button className="reset-btn" onClick={resetFilters}>リセット</button>
            </div>
          </div>

          {savedFilters.length > 0 && (
            <div className="saved-filters">
              <label>保存済み条件</label>
              {savedFilters.map(f => (
                <div key={f.id} className="saved-filter-item">
                  <button onClick={() => loadFilter(f)} className="load-filter-btn">{f.name}</button>
                  <button onClick={() => deleteFilter(f.id)} className="delete-filter-btn">×</button>
                </div>
              ))}
            </div>
          )}

          <div className="filter-group">
            <label>🔍 検索</label>
            <input type="text" placeholder="銘柄コード" value={filters.searchCode} onChange={e => handleFilterChange('searchCode', e.target.value)} className="search-input" />
            <input type="text" placeholder="銘柄名" value={filters.searchName} onChange={e => handleFilterChange('searchName', e.target.value)} className="search-input" style={{marginTop:'0.5rem'}} />
          </div>

          <div className="filter-group">
            <label className="checkbox-label">
              <input type="checkbox" checked={filters.favoritesOnly} onChange={e => handleFilterChange('favoritesOnly', e.target.checked)} />
              ⭐ お気に入りのみ ({favorites.length})
            </label>
          </div>

          <div className="filter-group">
            <label>セクター</label>
            <select className="sector-select" value={filters.sector} onChange={e => handleFilterChange('sector', e.target.value)}>
              <option value="">すべて</option>
              {sectors.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {[
            {label:'株価（円）',min:'priceMin',max:'priceMax'},
            {label:'PER（倍）',min:'perMin',max:'perMax',step:'0.1'},
            {label:'PBR（倍）',min:'pbrMin',max:'pbrMax',step:'0.1'},
            {label:'配当利回り（%）',min:'dividendYieldMin',max:'dividendYieldMax',step:'0.1'},
            {label:'ROE（%）',min:'roeMin',max:'roeMax',step:'0.1'},
            {label:'ROA（%）',min:'roaMin',max:'roaMax',step:'0.1'},
            {label:'自己資本比率（%）',min:'equityRatioMin',max:'equityRatioMax',step:'0.1'},
            {label:'時価総額（百万円）',min:'marketCapMin',max:'marketCapMax'},
          ].map(({label,min,max,step}) => (
            <div className="filter-group" key={min}>
              <label>{label}</label>
              <div className="range-inputs">
                <input type="number" step={step} placeholder="下限" value={filters[min]} onChange={e => handleFilterChange(min, e.target.value)} />
                <span>〜</span>
                <input type="number" step={step} placeholder="上限" value={filters[max]} onChange={e => handleFilterChange(max, e.target.value)} />
              </div>
            </div>
          ))}

          <div className="filter-stats">
            <span>{sortedStocks.length} / {apiStocks.length} 銘柄</span>
          </div>
        </aside>

        <main className="main-content">
          {(loading || error) && (
            <div className={`api-status ${error ? 'error' : 'loading'}`}>
              <p>{getAPIStatusMessage(loading, error, apiStocks.length)}</p>
              {error && <button onClick={fetchScreenerData} className="retry-btn">再読み込み</button>}
            </div>
          )}

          <div className="table-container">
            <table className="stock-table">
              <thead>
                <tr>
                  <th style={{width:'50px'}}>★</th>
                  <th onClick={() => handleSort('code')}>コード <SortIndicator columnKey="code" /></th>
                  <th onClick={() => handleSort('name')}>銘柄名 <SortIndicator columnKey="name" /></th>
                  <th onClick={() => handleSort('sector')}>セクター <SortIndicator columnKey="sector" /></th>
                  <th onClick={() => handleSort('price')}>株価 <SortIndicator columnKey="price" /></th>
                  <th onClick={() => handleSort('per')}>PER <SortIndicator columnKey="per" /></th>
                  <th onClick={() => handleSort('pbr')}>PBR <SortIndicator columnKey="pbr" /></th>
                  <th onClick={() => handleSort('dividendYield')}>配当利回り <SortIndicator columnKey="dividendYield" /></th>
                  <th onClick={() => handleSort('roe')}>ROE <SortIndicator columnKey="roe" /></th>
                  <th onClick={() => handleSort('roa')}>ROA <SortIndicator columnKey="roa" /></th>
                  <th onClick={() => handleSort('equityRatio')}>自己資本比率 <SortIndicator columnKey="equityRatio" /></th>
                  <th onClick={() => handleSort('valueScore')}>割安度 <SortIndicator columnKey="valueScore" /></th>
                  <th onClick={() => handleSort('marketCap')}>時価総額 <SortIndicator columnKey="marketCap" /></th>
                </tr>
              </thead>
              <tbody>
                {sortedStocks.map(stock => (
                  <tr key={stock.code} onClick={() => setSelectedStock(stock)} className="clickable-row">
                    <td onClick={e => toggleFavorite(stock.code, e)} className="favorite-cell">{favorites.includes(stock.code) ? '⭐' : '☆'}</td>
                    <td className="code">{stock.code}</td>
                    <td className="name">{stock.name}</td>
                    <td className="sector">{stock.sector}</td>
                    <td className="price">¥{stock.price?.toLocaleString() || '-'}</td>
                    <td className={`per ${stock.per && stock.per < 15 ? 'highlight-good' : ''}`}>{formatNumber(stock.per)}倍</td>
                    <td className={`pbr ${stock.pbr && stock.pbr < 1 ? 'highlight-good' : ''}`}>{formatNumber(stock.pbr,2)}倍</td>
                    <td className={`dividend ${stock.dividendYield && stock.dividendYield >= 3 ? 'highlight-good' : ''}`}>{formatNumber(stock.dividendYield)}%</td>
                    <td className={`roe ${stock.roe && stock.roe >= 10 ? 'highlight-good' : ''}`}>{formatNumber(stock.roe)}%</td>
                    <td className={`roa ${stock.roa && stock.roa >= 5 ? 'highlight-good' : ''}`}>{formatNumber(stock.roa)}%</td>
                    <td className={`equity-ratio ${stock.equityRatio && stock.equityRatio >= 40 ? 'highlight-good' : ''}`}>{formatNumber(stock.equityRatio)}%</td>
                    <td className="value-score"><ScoreBadge score={stock.valueScore} /></td>
                    <td className="market-cap">{formatMarketCap(stock.marketCap)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {sortedStocks.length === 0 && !loading && (
            <div className="no-results">
              <p>条件に一致する銘柄がありません</p>
              <button onClick={resetFilters}>フィルターをリセット</button>
            </div>
          )}
        </main>
      </div>

      <footer className="footer">
        <p>※J-Quants API（Lightプラン）からリアルタイムデータを取得しています。投資判断は自己責任でお願いします。</p>
      </footer>

      {selectedStock && <StockDetailModal stock={selectedStock} onClose={() => setSelectedStock(null)} />}
      {showRanking && <RankingModal onClose={() => setShowRanking(false)} />}
      
      {showSaveFilter && (
        <div className="modal-overlay" onClick={() => setShowSaveFilter(false)}>
          <div className="modal-content small-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>フィルター条件を保存</h2>
              <button className="modal-close" onClick={() => setShowSaveFilter(false)}>×</button>
            </div>
            <div className="modal-body">
              <input type="text" placeholder="条件名（例：割安高配当株）" value={filterName} onChange={e => setFilterName(e.target.value)} className="filter-name-input" autoFocus />
              <div className="modal-actions">
                <button onClick={saveCurrentFilter} className="btn-primary" disabled={!filterName.trim()}>保存</button>
                <button onClick={() => setShowSaveFilter(false)} className="btn-secondary">キャンセル</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
