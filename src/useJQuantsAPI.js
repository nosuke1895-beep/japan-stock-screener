import { useState, useEffect, useCallback } from 'react';
import JQuantsAPIClient from './jquants-api';

/**
 * J-Quants API用のカスタムフック
 */
export function useJQuantsAPI() {
  const [client, setClient] = useState(null);
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // APIクライアントの初期化
  useEffect(() => {
    const apiKey = import.meta.env.VITE_JQUANTS_API_KEY;
    
    if (!apiKey) {
      setError('APIキーが設定されていません。.envファイルを確認してください。');
      return;
    }

    const apiClient = new JQuantsAPIClient(apiKey);
    setClient(apiClient);
  }, []);

  /**
   * スクリーナーデータを取得
   */
  const fetchScreenerData = useCallback(async () => {
    if (!client) {
      setError('APIクライアントが初期化されていません');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await client.getScreenerData();
      setStocks(data);
    } catch (err) {
      setError(err.message || 'データの取得に失敗しました');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [client]);

  /**
   * 特定の銘柄データを取得
   */
  const fetchStocksByCode = useCallback(async (codes) => {
    if (!client) {
      setError('APIクライアントが初期化されていません');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await client.getMultipleStocks(codes);
      return data;
    } catch (err) {
      setError(err.message || 'データの取得に失敗しました');
      console.error('Fetch error:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [client]);

  return {
    stocks,
    loading,
    error,
    fetchScreenerData,
    fetchStocksByCode,
  };
}

/**
 * APIステータス表示用のヘルパー
 */
export function getAPIStatusMessage(loading, error, dataCount) {
  if (loading) return '読み込み中...';
  if (error) return `エラー: ${error}`;
  if (dataCount === 0) return 'データがありません';
  return `${dataCount}件のデータを取得しました`;
}
