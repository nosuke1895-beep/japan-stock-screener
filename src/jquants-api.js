/**
 * J-Quants API Client (バックエンドサーバー経由)
 */

const API_BASE_URL = import.meta.env.PROD ? '/api' : 'http://localhost:3001/api';

class JQuantsAPIClient {
  constructor() {
    // バックエンドサーバー経由なのでAPIキー不要
  }

  /**
   * スクリーナー用データ取得
   * @returns {Promise<Array>}
   */
  async getScreenerData() {
    try {
      const response = await fetch(`${API_BASE_URL}/screening`);
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // データを整形
      return data.stocks.map(stock => ({
        code: stock.code,
        name: stock.name,
        sector: stock.sector,
        market: stock.market,
        price: stock.price || 0,
        per: stock.per || 0,
        pbr: stock.pbr || 0,
        dividendYield: stock.dividendYield || 0,
        marketCap: stock.marketCap || 0,
        roe: stock.roe || 0,
        roa: stock.roa || 0,
        equityRatio: stock.equityRatio || 0,
        // 詳細情報用
        eps: stock.eps || 0,
        bps: stock.bps || 0,
        dividend: stock.dividend || 0,
        netIncome: stock.netIncome || 0,
        equity: stock.equity || 0,
        totalAssets: stock.totalAssets || 0,
        shares: stock.shares || 0,
      }));
    } catch (error) {
      console.error('Failed to fetch screener data:', error);
      throw error;
    }
  }
}

export default JQuantsAPIClient;
