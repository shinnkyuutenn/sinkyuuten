# Sinkyuuten（新急点）

インド都市向けレストラン・ホテル・スポット検索アプリ

## 📋 プロジェクト概要

ユーザーの好みに基づいて、インドの都市（Hyderabad、Mumbai、Delhi）のレストラン、ホテル、観光スポットを検索・共有できるモバイルファーストWebアプリケーション。

## 🛠️ 技術スタック

### フロントエンド
- **React** 19.2.0
- **Vite** 7.2.6 - ビルドツール
- **Tailwind CSS** 3.4.14 - スタイリング
- **@react-google-maps/api** 2.20.7 - 地図機能

### 開発ツール
- **PostCSS** - CSS処理
- **Autoprefixer** - ブラウザ互換性

## 💻 環境要件

- **Node.js**: 18.x 以上
- **npm**: 9.x 以上
- **ブラウザ**: 最新版のChrome、Safari、Firefox、Edge

## 🚀 インストール手順

### 1. リポジトリのクローン

```bash
git clone https://github.com/shinnkyuutenn/sinkyuuten.git
cd sinkyuuten
```

### 2. 依存関係のインストール

```bash
npm install
```

### 3. 開発サーバーの起動

```bash
npm run dev
```

アプリは `http://localhost:5173/` で起動します。

### 4. ビルド（本番環境用）

```bash
npm run build
```

ビルドされたファイルは `dist/` フォルダに生成されます。

### 5. プレビュー

```bash
npm run preview
```

## 🔑 API設定

### Google Maps API

プロジェクトには Google Maps JavaScript API が必要です。

**現在の設定:**
- API Key: `AIzaSyCf_VRFHEmNuNbfalEifqsiVwJ21sasdtg`
- 言語: 日本語（ja）

**変更方法:**
`src/App.jsx` の Google Maps 設定部分で API キーを変更してください。

```javascript
const { isLoaded } = useJsApiLoader({
  googleMapsApiKey: 'YOUR_API_KEY_HERE',
  language: 'ja',
});
```

## 📱 主要機能

### 1. ホームページ
- 現在地周辺検索
- 都市別検索（Bombay、Hyderabad）
- 条件フィルター検索

### 2. 検索フィルター
- **辛さ耐性**: 0-5レベル（0 SHU - 25000 SHU）
- **清潔重視度**: 5段階評価
- **快適さ重視度**: 5段階評価
- **混雑苦手度**: 5段階評価
- **都市選択**: Hyderabad、Mumbai、Delhi
- **カテゴリ**: 飲食店、ホテル、スポット

### 3. ログイン・登録
- ユーザーログイン
- 新規ユーザー登録
- 個人設定（辛さ耐性、清潔度等）

### 4. マップページ
- Google Maps 統合
- 単指ジェスチャー対応
- POI非表示設定
- 位置ベース検索
- TripAdvisor 連携

### 5. スポット追加機能
- TripAdvisor からのURL共有
- 管理者への推薦送信

## 📁 プロジェクト構造

```
sinkyuuten/
├── src/
│   ├── App.jsx              # メインアプリケーション
│   ├── main.jsx             # エントリーポイント
│   ├── index.css            # グローバルスタイル
│   └── assets/
│       ├── icons/           # アイコン画像
│       └── images/          # 背景画像
├── dist/                    # ビルド出力
├── package.json             # 依存関係
├── vite.config.js          # Vite設定
├── tailwind.config.js      # Tailwind設定
└── postcss.config.js       # PostCSS設定
```

## 🌐 モバイル対応

- レスポンシブデザイン
- 最大幅: 448px（max-w-md）
- タッチジェスチャー最適化
- iOS/Android対応

## 🎨 デザイン特徴

- **カラースキーム**: Violet（紫）ベース
- **フォント**: Inter
- **シャドウ**: 多層シャドウ効果
- **アニメーション**: スムーズなトランジション

## 📱 ローカルネットワークアクセス

モバイルデバイスからアクセスする場合：

```bash
# 同じWi-Fiネットワークに接続
# ブラウザで以下のアドレスにアクセス
http://[YOUR_COMPUTER_IP]:5173
```

開発サーバーは自動的にネットワークアクセスを許可します（`vite.config.js` の `host: true` 設定）。

## 🐛 トラブルシューティング

### 地図が表示されない
- Google Maps API キーが有効か確認
- ネットワーク接続を確認

### モバイルで動作しない
- 同じWi-Fiに接続しているか確認
- ファイアウォール設定を確認

## 📄 ライセンス

ISC

## 👥 コントリビューション

プルリクエスト歓迎！

---

**作成日**: 2025年12月
**最終更新**: 2025年12月4日
