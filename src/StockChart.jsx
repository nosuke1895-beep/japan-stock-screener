import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const StockChart = ({ code }) => {
  const [chartData, setChartData] = useState([])
  const [period, setPeriod] = useState('1M')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const periods = [
    { value: '1D', label: '1日' },
    { value: '1W', label: '1週間' },
    { value: '1M', label: '1ヶ月' },
    { value: '3M', label: '3ヶ月' },
    { value: '6M', label: '6ヶ月' },
    { value: '1Y', label: '1年' },
    { value: '3Y', label: '3年' },
    { value: '5Y', label: '5年' },
  ]

  useEffect(() => {
    if (!code) return
    
    const fetchChartData = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const response = await fetch(`http://localhost:3001/api/chart/${code}?period=${period}`)
        
        if (!response.ok) {
          throw new Error('チャートデータの取得に失敗しました')
        }
        
        const result = await response.json()
        setChartData(result.data || [])
      } catch (err) {
        console.error('Chart fetch error:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    
    fetchChartData()
  }, [code, period])

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    const year = dateStr.substring(0, 4)
    const month = dateStr.substring(4, 6)
    const day = dateStr.substring(6, 8)
    return `${year}/${month}/${day}`
  }

  const formatYAxis = (value) => {
    return `¥${value.toLocaleString()}`
  }

  if (loading) {
    return <div className="chart-loading">チャートを読み込み中...</div>
  }

  if (error) {
    return <div className="chart-error">エラー: {error}</div>
  }

  if (!chartData || chartData.length === 0) {
    return <div className="chart-no-data">チャートデータがありません</div>
  }

  return (
    <div className="stock-chart">
      <div className="chart-header">
        <h3>株価チャート</h3>
        <div className="period-selector">
          {periods.map(p => (
            <button
              key={p.value}
              className={`period-btn ${period === p.value ? 'active' : ''}`}
              onClick={() => setPeriod(p.value)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
      
      <div className="chart-container-inner">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="date" 
              tickFormatter={formatDate}
              stroke="#9ca3af"
              style={{ fontSize: '0.75rem' }}
            />
            <YAxis 
              tickFormatter={formatYAxis}
              stroke="#9ca3af"
              style={{ fontSize: '0.75rem' }}
            />
            <Tooltip 
              labelFormatter={formatDate}
              formatter={(value) => [`¥${value.toLocaleString()}`, '終値']}
              contentStyle={{ 
                backgroundColor: '#1f2937', 
                border: '1px solid #374151',
                borderRadius: '6px'
              }}
            />
            <Line 
              type="monotone" 
              dataKey="adjustedClose" 
              stroke="#3b82f6" 
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {chartData.length > 0 && (
        <div className="chart-info">
          <span>期間: {formatDate(chartData[0].date)} 〜 {formatDate(chartData[chartData.length - 1].date)}</span>
          <span>データ件数: {chartData.length}日</span>
        </div>
      )}
    </div>
  )
}

export default StockChart
