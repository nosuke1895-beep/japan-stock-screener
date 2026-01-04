import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const FinancialChart = ({ code }) => {
  const [financialData, setFinancialData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!code) return
    
    const fetchFinancialData = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const response = await fetch(`http://localhost:3001/api/financials/${code}`)
        
        if (!response.ok) {
          throw new Error('財務データの取得に失敗しました')
        }
        
        const result = await response.json()
        setFinancialData(result.data || [])
      } catch (err) {
        console.error('Financial fetch error:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    
    fetchFinancialData()
  }, [code])

  const formatYAxis = (value) => {
    if (value >= 100000000) {
      return `${(value / 100000000).toFixed(0)}億円`
    }
    return `${value.toLocaleString()}百万円`
  }

  const formatTooltip = (value) => {
    if (value >= 100000000) {
      return `${(value / 100000000).toFixed(1)}億円`
    }
    return `${value.toLocaleString()}百万円`
  }

  if (loading) {
    return <div className="chart-loading">財務データを読み込み中...</div>
  }

  if (error) {
    return <div className="chart-error">エラー: {error}</div>
  }

  if (!financialData || financialData.length === 0) {
    return <div className="chart-no-data">財務データがありません</div>
  }

  return (
    <div className="financial-chart">
      <div className="chart-header">
        <h3>📊 財務推移（過去5年）</h3>
      </div>
      
      <div className="chart-container-inner">
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={financialData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="fiscalYear" 
              stroke="#9ca3af"
              style={{ fontSize: '0.75rem' }}
            />
            <YAxis 
              tickFormatter={formatYAxis}
              stroke="#9ca3af"
              style={{ fontSize: '0.75rem' }}
            />
            <Tooltip 
              formatter={formatTooltip}
              contentStyle={{ 
                backgroundColor: '#1f2937', 
                border: '1px solid #374151',
                borderRadius: '6px'
              }}
            />
            <Legend 
              wrapperStyle={{ fontSize: '0.85rem' }}
            />
            <Line 
              type="monotone" 
              dataKey="revenue" 
              stroke="#3b82f6" 
              strokeWidth={2}
              name="売上高"
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line 
              type="monotone" 
              dataKey="operatingIncome" 
              stroke="#10b981" 
              strokeWidth={2}
              name="営業利益"
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line 
              type="monotone" 
              dataKey="ordinaryIncome" 
              stroke="#f59e0b" 
              strokeWidth={2}
              name="経常利益"
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {financialData.length > 0 && (
        <div className="chart-info">
          <span>期間: {financialData[0].fiscalYear} 〜 {financialData[financialData.length - 1].fiscalYear}</span>
          <span>データ件数: {financialData.length}年分</span>
        </div>
      )}
    </div>
  )
}

export default FinancialChart
