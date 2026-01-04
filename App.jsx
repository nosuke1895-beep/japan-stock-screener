import { useState, useMemo, useEffect } from 'react'
import './App.css'
import { useJQuantsAPI, getAPIStatusMessage } from './useJQuantsAPI'

function App() {
  const { stocks: apiStocks, loading, error, fetchScreenerData } = useJQuantsAPI();

  // 初回データ取得
  useEffect(() => {
    fetchScreenerData();
  }, [fetchScreenerData]);

  // フィルター状態
  const [filters, setFilters] = useState({
    priceMin: '',
    priceMax: '',
    perMin: '',
    perMax: '',
    pbrMin: '',
    pbrMax: '',
    dividendYieldMin: '',
    dividendYieldMax: '',
    marketCapMin: '',
    marketCapMax: '',
    roeMin: '',
    roeMax: '',
    roaMin: '',
    roaMax: '',
    equityRatioMin: '',
    equityRatioMax: '',
    sector: '', // セクターフィルター
  })

  // モーダル状態
  const [selectedStock, setSelectedStock] = useState(null)

  // ソート状態
  const [sortConfig, setSortConfig] = useState({ key: 'code', direction: 'asc' })

  // セクター一覧を取得
  const sectors = useMemo(() => {
    const uniqueSectors = [...new Set(apiStocks.map(s => s.sector))].filter(Boolean).sort()
    return uniqueSectors
  }, [apiStocks])

  // フィルター更新
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  // フィルター適用
  const filteredStocks = useMemo(() => {
    return apiStocks.filter(stock => {
      const { 
        priceMin, priceMax, perMin, perMax, pbrMin, pbrMax, 
        dividendYieldMin, dividendYieldMax, marketCapMin, marketCapMax,
        roeMin, roeMax, roaMin, roaMax, equityRatioMin, equityRatioMax,
        sector
      } = filters

      if (priceMin && stock.price < Number(priceMin)) return false
      if (priceMax && stock.price > Number(priceMax)) return false
      if (perMin && stock.per < Number(perMin)) return false
      if (perMax && stock.per > Number(perMax)) return false
      if (pbrMin && stock.pbr < Number(pbrMin)) return false
      if (pbrMax && stock.pbr > Number(pbrMax)) return false
      if (dividendYieldMin && stock.dividendYield < Number(dividendYieldMin)) return false
      if (dividendYieldMax && stock.dividendYield > Number(dividendYieldMax)) return false
      if (marketCapMin && stock.marketCap < Number(marketCapMin) * 1000000) return false
      if (marketCapMax && stock.marketCap > Number(marketCapMax) * 1000000) return false
      if (roeMin && stock.roe < Number(roeMin)) return false
      if (roeMax && stock.roe > Number(roeMax)) return false
      if (roaMin && stock.roa < Number(roaMin)) return false
      if (roaMax && stock.roa > Number(roaMax)) return false
      if (equityRatioMin && stock.equityRatio < Number(equityRatioMin)) return false
      if (equityRatioMax && stock.equityRatio > Number(equityRatioMax)) return false
      if (sector && stock.sector !== sector) return false

      return true
    })
  }, [apiStocks, filters])

  // ソート適用
  const sortedStocks = useMemo(() => {
    const sorted = [...filteredStocks]
    sorted.sort((a, b) => {
      let aValue = a[sortConfig.key]
      let bValue = b[sortConfig.key]
      
      // nullやundefinedを末尾に
      if (aValue == null) return 1
      if (bValue == null) return -1
      
      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1
      }
      return 0
    })
    return sorted
  }, [filteredStocks, sortConfig])

  // ソート切り替え
  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  // フィルターリセット
  const resetFilters = () => {
    setFilters({
      priceMin: '',
      priceMax: '',
      perMin: '',
      perMax: '',
      pbrMin: '',
      pbrMax: '',
      dividendYieldMin: '',
      dividendYieldMax: '',
      marketCapMin: '',
      marketCapMax: '',
      roeMin: '',
      roeMax: '',
      roaMin: '',
      roaMax: '',
      equityRatioMin: '',
      equityRatioMax: '',
      sector: '',
    })
  }

  // 時価総額をフォーマット
  const formatMarketCap = (value) => {
    if (!value) return '-'
    if (value >= 10000000) {
      return `${(value / 10000000).toFixed(1)}兆円`
    }
    return `${(value / 10000).toFixed(0)}億円`
  }

  // 数値フォーマット
  const formatNumber = (value, decimals = 1) => {
    if (value == null) return '-'
    return value.toFixed(decimals)
  }

  // ソートインジケーター
  const SortIndicator = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) return <span className="sort-indicator">⇅</span>
    return <span className="sort-indicator active">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
  }

  // 詳細モーダル
  const StockDetailModal = ({ stock, onClose }) => {
    if (!stock) return null

    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>{stock.code} - {stock.name}</h2>
            <button className="modal-close" onClick={onClose}>×</button>
          </div>
          
          <div className="modal-body">
            <div className="detail-section">
              <h3>基本情報</h3>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">セクター</span>
                  <span className="detail-value">{stock.sector}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">市場</span>
                  <span className="detail-value">{stock.market}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">株価</span>
                  <span className="detail-value">¥{stock.price?.toLocaleString() || '-'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">時価総額</span>
                  <span className="detail-value">{formatMarketCap(stock.marketCap)}</span>
                </div>
              </div>
            </div>

            <div className="detail-section">
              <h3>バリュエーション</h3>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">PER</span>
                  <span className="detail-value">{formatNumber(stock.per)}倍</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">PBR</span>
                  <span className="detail-value">{formatNumber(stock.pbr, 2)}倍</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">EPS</span>
                  <span className="detail-value">¥{formatNumber(stock.eps, 2)}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">BPS</span>
                  <span className="detail-value">¥{formatNumber(stock.bps, 2)}</span>
                </div>
              </div>
            </div>

            <div className="detail-section">
              <h3>配当</h3>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">配当利回り</span>
                  <span className="detail-value">{formatNumber(stock.dividendYield)}%</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">配当金</span>
                  <span className="detail-value">¥{formatNumber(stock.dividend, 2)}</span>
                </div>
              </div>
            </div>

            <div className="detail-section">
              <h3>収益性指標</h3>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">ROE（自己資本利益率）</span>
                  <span className="detail-value">{formatNumber(stock.roe)}%</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">ROA（総資産利益率）</span>
                  <span className="detail-value">{formatNumber(stock.roa)}%</span>
                </div>
              </div>
            </div>

            <div className="detail-section">
              <h3>財務健全性</h3>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">自己資本比率</span>
                  <span className="detail-value">{formatNumber(stock.equityRatio)}%</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">自己資本</span>
                  <span className="detail-value">{stock.equity ? `${(stock.equity / 100000000).toFixed(0)}億円` : '-'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">総資産</span>
                  <span className="detail-value">{stock.totalAssets ? `${(stock.totalAssets / 100000000).toFixed(0)}億円` : '-'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">当期純利益</span>
                  <span className="detail-value">{stock.netIncome ? `${(stock.netIncome / 100000000).toFixed(0)}億円` : '-'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="header">
        <h1>📈 日本株スクリーナー</h1>
        <p className="subtitle">割安株を見つけよう</p>
      </header>

      <div className="container">
        {/* フィルターパネル */}
        <aside className="filter-panel">
          <div className="filter-header">
            <h2>フィルター</h2>
            <button className="reset-btn" onClick={resetFilters}>リセット</button>
          </div>

          <div className="filter-group">
            <label>セクター</label>
            <select 
              className="sector-select"
              value={filters.sector}
              onChange={(e) => handleFilterChange('sector', e.target.value)}
            >
              <option value="">すべて</option>
              {sectors.map(sector => (
                <option key={sector} value={sector}>{sector}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>株価（円）</label>
            <div className="range-inputs">
              <input
                type="number"
                placeholder="下限"
                value={filters.priceMin}
                onChange={(e) => handleFilterChange('priceMin', e.target.value)}
              />
              <span>〜</span>
              <input
                type="number"
                placeholder="上限"
                value={filters.priceMax}
                onChange={(e) => handleFilterChange('priceMax', e.target.value)}
              />
            </div>
          </div>

          <div className="filter-group">
            <label>PER（倍）</label>
            <div className="range-inputs">
              <input
                type="number"
                step="0.1"
                placeholder="下限"
                value={filters.perMin}
                onChange={(e) => handleFilterChange('perMin', e.target.value)}
              />
              <span>〜</span>
              <input
                type="number"
                step="0.1"
                placeholder="上限"
                value={filters.perMax}
                onChange={(e) => handleFilterChange('perMax', e.target.value)}
              />
            </div>
          </div>

          <div className="filter-group">
            <label>PBR（倍）</label>
            <div className="range-inputs">
              <input
                type="number"
                step="0.1"
                placeholder="下限"
                value={filters.pbrMin}
                onChange={(e) => handleFilterChange('pbrMin', e.target.value)}
              />
              <span>〜</span>
              <input
                type="number"
                step="0.1"
                placeholder="上限"
                value={filters.pbrMax}
                onChange={(e) => handleFilterChange('pbrMax', e.target.value)}
              />
            </div>
          </div>

          <div className="filter-group">
            <label>配当利回り（%）</label>
            <div className="range-inputs">
              <input
                type="number"
                step="0.1"
                placeholder="下限"
                value={filters.dividendYieldMin}
                onChange={(e) => handleFilterChange('dividendYieldMin', e.target.value)}
              />
              <span>〜</span>
              <input
                type="number"
                step="0.1"
                placeholder="上限"
                value={filters.dividendYieldMax}
                onChange={(e) => handleFilterChange('dividendYieldMax', e.target.value)}
              />
            </div>
          </div>

          <div className="filter-group">
            <label>ROE（%）</label>
            <div className="range-inputs">
              <input
                type="number"
                step="0.1"
                placeholder="下限"
                value={filters.roeMin}
                onChange={(e) => handleFilterChange('roeMin', e.target.value)}
              />
              <span>〜</span>
              <input
                type="number"
                step="0.1"
                placeholder="上限"
                value={filters.roeMax}
                onChange={(e) => handleFilterChange('roeMax', e.target.value)}
              />
            </div>
          </div>

          <div className="filter-group">
            <label>ROA（%）</label>
            <div className="range-inputs">
              <input
                type="number"
                step="0.1"
                placeholder="下限"
                value={filters.roaMin}
                onChange={(e) => handleFilterChange('roaMin', e.target.value)}
              />
              <span>〜</span>
              <input
                type="number"
                step="0.1"
                placeholder="上限"
                value={filters.roaMax}
                onChange={(e) => handleFilterChange('roaMax', e.target.value)}
              />
            </div>
          </div>

          <div className="filter-group">
            <label>自己資本比率（%）</label>
            <div className="range-inputs">
              <input
                type="number"
                step="0.1"
                placeholder="下限"
                value={filters.equityRatioMin}
                onChange={(e) => handleFilterChange('equityRatioMin', e.target.value)}
              />
              <span>〜</span>
              <input
                type="number"
                step="0.1"
                placeholder="上限"
                value={filters.equityRatioMax}
                onChange={(e) => handleFilterChange('equityRatioMax', e.target.value)}
              />
            </div>
          </div>

          <div className="filter-group">
            <label>時価総額（百万円）</label>
            <div className="range-inputs">
              <input
                type="number"
                placeholder="下限"
                value={filters.marketCapMin}
                onChange={(e) => handleFilterChange('marketCapMin', e.target.value)}
              />
              <span>〜</span>
              <input
                type="number"
                placeholder="上限"
                value={filters.marketCapMax}
                onChange={(e) => handleFilterChange('marketCapMax', e.target.value)}
              />
            </div>
          </div>

          <div className="filter-stats">
            <span>{sortedStocks.length} / {apiStocks.length} 銘柄</span>
          </div>
        </aside>

        {/* 銘柄一覧テーブル */}
        <main className="main-content">
          {/* API状態表示 */}
          {(loading || error) && (
            <div className={`api-status ${error ? 'error' : 'loading'}`}>
              <p>{getAPIStatusMessage(loading, error, apiStocks.length)}</p>
              {error && (
                <button onClick={fetchScreenerData} className="retry-btn">
                  再読み込み
                </button>
              )}
            </div>
          )}

          <div className="table-container">
            <table className="stock-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort('code')}>
                    コード <SortIndicator columnKey="code" />
                  </th>
                  <th onClick={() => handleSort('name')}>
                    銘柄名 <SortIndicator columnKey="name" />
                  </th>
                  <th onClick={() => handleSort('sector')}>
                    セクター <SortIndicator columnKey="sector" />
                  </th>
                  <th onClick={() => handleSort('price')}>
                    株価 <SortIndicator columnKey="price" />
                  </th>
                  <th onClick={() => handleSort('per')}>
                    PER <SortIndicator columnKey="per" />
                  </th>
                  <th onClick={() => handleSort('pbr')}>
                    PBR <SortIndicator columnKey="pbr" />
                  </th>
                  <th onClick={() => handleSort('dividendYield')}>
                    配当利回り <SortIndicator columnKey="dividendYield" />
                  </th>
                  <th onClick={() => handleSort('roe')}>
                    ROE <SortIndicator columnKey="roe" />
                  </th>
                  <th onClick={() => handleSort('roa')}>
                    ROA <SortIndicator columnKey="roa" />
                  </th>
                  <th onClick={() => handleSort('equityRatio')}>
                    自己資本比率 <SortIndicator columnKey="equityRatio" />
                  </th>
                  <th onClick={() => handleSort('marketCap')}>
                    時価総額 <SortIndicator columnKey="marketCap" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedStocks.map(stock => (
                  <tr 
                    key={stock.code} 
                    onClick={() => setSelectedStock(stock)}
                    className="clickable-row"
                  >
                    <td className="code">{stock.code}</td>
                    <td className="name">{stock.name}</td>
                    <td className="sector">{stock.sector}</td>
                    <td className="price">¥{stock.price?.toLocaleString() || '-'}</td>
                    <td className={`per ${stock.per && stock.per < 15 ? 'highlight-good' : ''}`}>
                      {formatNumber(stock.per)}倍
                    </td>
                    <td className={`pbr ${stock.pbr && stock.pbr < 1 ? 'highlight-good' : ''}`}>
                      {formatNumber(stock.pbr, 2)}倍
                    </td>
                    <td className={`dividend ${stock.dividendYield && stock.dividendYield >= 3 ? 'highlight-good' : ''}`}>
                      {formatNumber(stock.dividendYield)}%
                    </td>
                    <td className={`roe ${stock.roe && stock.roe >= 10 ? 'highlight-good' : ''}`}>
                      {formatNumber(stock.roe)}%
                    </td>
                    <td className={`roa ${stock.roa && stock.roa >= 5 ? 'highlight-good' : ''}`}>
                      {formatNumber(stock.roa)}%
                    </td>
                    <td className={`equity-ratio ${stock.equityRatio && stock.equityRatio >= 40 ? 'highlight-good' : ''}`}>
                      {formatNumber(stock.equityRatio)}%
                    </td>
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

      {/* 詳細モーダル */}
      {selectedStock && (
        <StockDetailModal stock={selectedStock} onClose={() => setSelectedStock(null)} />
      )}
    </div>
  )
}

export default App
