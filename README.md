# 📈 日本株スクリーナー（J-Quants API V2連携版）

J-Quants API V2を使用した日本株スクリーニングアプリケーションです。

## ✨ 機能

- **リアルタイムデータ取得**: J-Quants API（Lightプラン）から最新の株価データを取得
- **多彩なフィルター**: 株価、PER、PBR、配当利回り、時価総額で絞り込み
- **ソート機能**: 各列をクリックして昇順・降順で並び替え
- **割安株ハイライト**: PER < 15、PBR < 1、配当利回り ≥ 3%を自動ハイライト
- **レスポンシブデザイン**: モバイルでも快適に利用可能

## 🚀 セットアップ手順

### 1. J-Quants APIの準備

1. [J-Quants](https://jpx-jquants.com/)にアクセスしてユーザー登録
2. Lightプラン（またはそれ以上）を選択
3. APIキーを取得

### 2. 環境変数の設定

`.env.example`を`.env`にコピーして、APIキーを設定：

```bash
cp .env.example .env
```

`.env`ファイルを編集：

```env
VITE_JQUANTS_API_KEY=your_actual_api_key_here
```

### 3. 依存関係のインストール

```bash
npm install
```

### 4. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで `http://localhost:5173` を開く

## 📁 ファイル構成

```
.
├── App.jsx              # メインコンポーネント
├── App.css              # スタイル
├── jquants-api.js       # J-Quants API V2クライアント
├── useJQuantsAPI.js     # API用Reactフック
├── .env.example         # 環境変数のテンプレート
└── README.md            # このファイル
```

## 🔑 J-Quants API V2の主な仕様

### Lightプランで利用可能なエンドポイント

- `/v2/equities/bars/daily` - 日次株価データ
- `/v2/equities/listed` - 上場銘柄情報

### 認証方法

V2では`x-api-key`ヘッダーでAPIキーを送信：

```javascript
headers: {
  'x-api-key': 'your_api_key'
}
```

## 📊 データ項目

| 項目 | 説明 |
|------|------|
| コード | 証券コード（4桁） |
| 銘柄名 | 会社名 |
| セクター | 業種分類 |
| 株価 | 終値 |
| PER | 株価収益率（倍） |
| PBR | 株価純資産倍率（倍） |
| 配当利回り | 配当利回り（%） |
| 時価総額 | 時価総額 |

## ⚠️ 注意事項

### セキュリティ
- `.env`ファイルは絶対にGitにコミットしないこと
- APIキーは公開リポジトリに含めないこと

### データ利用規約
- 取得したデータは個人利用のみ
- 第三者への再配布は禁止
- 詳細は[J-Quants利用規約](https://jpx-jquants.com/)を確認

### API制限
- Lightプランにはレート制限があります
- 大量のリクエストを短時間で行わないこと

## 🛠️ トラブルシューティング

### エラー: "APIキーが設定されていません"
→ `.env`ファイルが正しく設定されているか確認

### エラー: "API Error: 401"
→ APIキーが間違っているか、有効期限切れの可能性

### データが表示されない
→ ブラウザのコンソールでエラーを確認
→ J-Quantsのサービス状況を確認

## 📝 ライセンス

このプロジェクトはMITライセンスの下で公開されています。

## 🔗 参考リンク

- [J-Quants公式サイト](https://jpx-jquants.com/)
- [J-Quants API V2仕様](https://jpx-jquants.com/ja/spec/)
- [V1→V2マイグレーションガイド](https://jpx-jquants.com/ja/spec/migration-v1-v2)
