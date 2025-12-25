# Sinkyuuten

インド都市向けレストラン・ホテル・スポット検索アプリ

## 📋 プロジェクト概要

ユーザーの好みに基づいて、インドの都市（Hyderabad、Mumbai、Delhi）のレストラン、ホテル、観光スポットを検索・共有できるモバイルファーストWebアプリケーション。

## 🛠️ 技術スタック

### フロントエンド
- **React** 19.2.0
- **Vite** 7.2.6 - ビルドツール
- **Tailwind CSS** 3.4.14 - スタイリング
- **@react-google-maps/api** 2.20.7 - 地図機能

### バックエンド
- **Node.js + Express** - REST API サーバー（ポート 3001）
- **Python + Flask** - 検索 API サーバー（ポート 5001）
- **PostgreSQL** - データベース

### 開発ツール
- **PostCSS** - CSS処理
- **Autoprefixer** - ブラウザ互換性

## 💻 環境要件

- **Node.js**: 18.x 以上
- **npm**: 9.x 以上
- **Python**: 3.9 以上
- **PostgreSQL**: 12.x 以上
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

### 2.5. Neon（PostgreSQL）に接続する（推奨）

このプロジェクトは **Node（`server.js`）** と **Python（`db.py`）** の両方が `NEON_DATABASE_URL`（または `DATABASE_URL`）を読みます（開発時はルートの `.env` を参照）。

1) ルートの `env.example` をコピーして `.env` を作成し、Neon の接続文字列を設定：

```bash
cp env.example .env
```

2) `.env` の `NEON_DATABASE_URL=...` を Neon Dashboard の接続文字列に置き換え（`sslmode=require` を含める）

補足：
- Neon の接続文字列に `channel_binding=require` が含まれる場合でも、Node 側は互換性のため自動で除去して接続します。
- 詳細は `NEON_SETUP.md` を参照してください。

### 3. データベースのセットアップ

#### 3.1 Neon を使う場合（推奨）

Neon 側にすでにスキーマ/データがある場合は **この手順は不要** です。

#### 3.2 ローカル PostgreSQL を使う場合（任意）

```bash
# PostgreSQL データベースを作成
createdb india_reviews

# スキーマを実行
psql -U user -d india_reviews -f src/india_reviews_schema.sql

# テストデータを投入
psql -U user -d india_reviews -f src/test_restaurants_data.sql
```

### 4. バックエンドサーバーの起動

**Node.js サーバー（ポート 3001）:**
```bash
npm run server
```

**Flask サーバー（ポート 5001）:**
```bash
# Python 依存関係のインストール
pip install -r requirements.txt

# Flask サーバーの起動
python app.py
```

### 5. フロントエンド開発サーバーの起動

```bash
npm run dev
```

アプリは `http://localhost:5173/` で起動します。

### 5.1 開発時の API ルーティング（Vite proxy）

開発時はフロントが **同一オリジン** で API を呼べるよう、Vite の proxy を利用します（モバイル/LAN でも `localhost` 問題が起きにくい設計）。

- `/api/*` → `http://localhost:3001`（Node / Express）
- `/search_shops_json` → `http://127.0.0.1:5001`（Flask）
- `/auth/*` → `http://127.0.0.1:5001`（Flask 認証エンドポイント）

そのため、フロントは下記のように **相対パス** で呼び出します：
- `GET /api/restaurants`
- `GET /api/keywords`
- `GET /search_shops_json?...`

### 6. ビルド（本番環境用）

```bash
npm run build
```

ビルドされたファイルは `dist/` フォルダに生成されます。

### 7. プレビュー

```bash
npm run preview
```

## 🔌 API エンドポイント

### Node.js サーバー（ポート 3001）
- `GET /api/restaurants` - レストランデータ取得
- `GET /api/keywords` - キーワード一覧取得

### Flask サーバー（ポート 5001）

#### 検索API
- `GET /search_shops_json` - 店舗検索（キーワード、フィルター、ソート対応）

#### 認証API（`/auth` プレフィックス）
- `POST /auth/login_json` - ログイン
- `POST /auth/register_json` - ユーザー登録
- `GET /auth/me_json` - ログイン状態確認
- `POST /auth/logout_json` - ログアウト

#### お気に入りAPI（`/auth` プレフィックス）
- `GET /auth/favorites_json` - お気に入り一覧取得
- `POST /auth/favorites_json` - お気に入り追加
- `DELETE /auth/favorites_json` - お気に入り削除
- `GET /auth/favorites_check_json` - お気に入り状態確認

#### 店舗追加API（`/shop` プレフィックス）
- `POST /shop/submit_url_json` - URL送信（全ユーザー）
- `GET /shop/pending_urls_json` - 送信URL一覧取得（管理者専用）
- `POST /shop/delete_url_json` - URL削除（管理者専用）
- `POST /shop/add_shop_json` - 店舗追加（ログイン必須）

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

### データベース接続設定

**Node.js サーバー（`server.js`）:**

- 推奨：`NEON_DATABASE_URL`（または `DATABASE_URL`）の接続文字列を利用
- 未設定の場合：`DB_HOST` / `DB_NAME` / `DB_USER` / `DB_PASSWORD` / `DB_PORT` を利用（ローカル向け）

**Flask サーバー（db.py）:**

- 推奨：`NEON_DATABASE_URL`（または `DATABASE_URL`）の接続文字列を利用
- 未設定の場合：`DB_HOST` / `DB_NAME` / `DB_USER` / `DB_PASSWORD` / `DB_PORT` を利用（ローカル向け）

環境変数を使用する場合は `.env` ファイルを作成してください。

## 📱 主要機能

### 1. ホームページ
- 現在地周辺検索
- 都市別検索（Bombay、Hyderabad）
- 条件フィルター検索

### 2. 検索フィルター
- **キーワード検索**: 店舗名やキーワードで検索
  - データベースから頻出キーワードを取得し、クイック選択タグとして表示（最大2行）
  - キーワードは出現頻度順にソート
- **辛さ耐性**: 0-5レベル（0 SHU - 25000 SHU）
- **清潔重視度**: 5段階評価
- **快適さ重視度**: 5段階評価
- **混雑苦手度**: 5段階評価
- **都市選択**: Hyderabad、Mumbai、Delhi
- **カテゴリ**: 飲食店、ホテル、スポット（複数選択可能）
- **検索結果画面**
  - オーバーレイ形式で表示（背景ページを変更しない）
  - 4つの評価項目（辛さ、清潔度、快適度、混雑度）を表示
  - 各項目でソート可能（昇順/降順）
  - 店舗をクリックして地図で位置確認

### 3. ユーザー認証システム
- **ログイン機能**
  - メールアドレスとパスワードでログイン
  - セッション管理（Flask session + cookie）
  - ログイン状態の自動チェック
- **新規ユーザー登録**
  - ユーザー名、メールアドレス、パスワードで登録
  - 個人設定（辛さ耐性、清潔度、快適度、混雑苦手度）を登録時に設定
  - 登録後自動ログイン
- **ログアウト機能**
  - サイドメニューからログアウト可能
  - ログアウト後、お気に入りデータもクリア
- **ユーザー情報表示**
  - ログイン後、左上角にユーザー名を表示
  - クリックでサイドメニューを開く

### 4. マップページ
- Google Maps 統合
- 単指ジェスチャー対応
- POI非表示設定
- 位置ベース検索
- TripAdvisor 連携
- 店舗詳細カード（70vh）と詳細ページ（90vh）の2段階表示
- 画像カルーセル（マウスドラッグ・タッチスワイプ対応）
- 店舗評価の4項目表示（辛さ、清潔度、快適度、混雑度）

### 5. お気に入り機能
- **お気に入り追加/削除**
  - 店舗詳細ページ、検索結果画面からお気に入りに追加可能
  - ハートアイコンで視覚的に表示（追加済みは紫色で表示）
  - ログイン必須（未ログイン時はログインページへリダイレクト）
- **お気に入り一覧**
  - サイドメニューから「お気に入り」ページへアクセス
  - お気に入りに追加した店舗を一覧表示
  - 店舗をクリックして詳細を表示・地図で位置確認
  - お気に入りから削除も可能

### 6. URL送信・ピン追加機能
- **URL送信**
  - 地図ページ右下角の「+」ボタンからURLを送信
  - 送信されたURLは管理者が確認できる
  - 送信成功後、成功メッセージを表示
- **ピン追加（管理者専用）**
  - 管理者ログイン後、右上角メニューに「ピン追加」オプションが表示
  - URL一覧から選択して店舗情報を入力
  - 店舗名、タイプ、座標、評価レベル、写真URL、キーワードを入力
  - 追加成功後、URL送信者のお気に入りに自動追加
  - 新規キーワードは自動的にキーワードデータベースに同期

## 📁 プロジェクト構造

```
sinkyuuten/
├── src/
│   ├── App.jsx              # メインアプリケーション
│   ├── main.jsx             # エントリーポイント
│   ├── index.css            # グローバルスタイル
│   ├── assets/
│   │   ├── icons/           # アイコン画像
│   │   └── images/          # 背景画像
│   ├── india_reviews_schema.sql  # データベーススキーマ
│   └── test_restaurants_data.sql # テストデータ
├── app.py                   # Flask サーバー（検索API + 認証API）
├── login.py                 # Flask 認証ブループリント（ログイン・登録・お気に入り）
├── add_shop.py              # 店舗追加ブループリント（URL送信・ピン追加）
├── recommend.py             # レコメンド機能ブループリント
├── db.py                    # データベース接続
├── models.py                # データモデル
├── server.js                # Node.js Express サーバー
├── create_admin.py          # 管理者アカウント作成スクリプト
├── create_submitted_urls_table.py  # URL送信テーブル作成スクリプト
├── src/
│   ├── create_favorites_table.sql  # お気に入りテーブル作成SQL
│   └── create_submitted_urls_table.sql  # URL送信テーブル作成SQL
├── dist/                    # ビルド出力
├── package.json             # Node.js 依存関係
├── vite.config.js          # Vite設定
├── tailwind.config.js      # Tailwind設定
└── postcss.config.js       # PostCSS設定
```

## 🌐 モバイル対応

- レスポンシブデザイン
- **最大幅固定**: 448px（max-w-md）- デスクトップでも最大幅を固定し、内容が過度に伸びないように制限
- タッチジェスチャー最適化
- iOS/Android対応
- 動的ビューポート高さ（dvh）対応
- 横スクロール防止
- スクロールバー非表示（機能は維持）

## 🎨 デザイン特徴

- **カラースキーム**: Violet（紫）ベース
- **フォント**: Inter
- **シャドウ**: 多層シャドウ効果
- **アニメーション**: スムーズなトランジション

## 📱 モバイルデプロイ

モバイルデバイスからアクセスする場合：

1. **すべてのサービスを起動**
   ```bash
   # ターミナル1: Node.js サーバー
   npm run server
   
   # ターミナル2: Flask サーバー
   python3 app.py
   
   # ターミナル3: Vite 開発サーバー
   npm run dev
   ```

2. **本機IPアドレスを確認**
   ```bash
   # macOS/Linux
   ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1
   
   # Windows
   ipconfig
   ```

3. **モバイルブラウザでアクセス**
   - 同じWi-Fiネットワークに接続
   - `http://[YOUR_IP]:5173` にアクセス

詳細は `MOBILE_DEPLOY.md` を参照してください。

**注意**: すべてのサーバーは `host: '0.0.0.0'` で設定されており、LANアクセスが可能です。

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

詳細な協作ガイドは [COLLABORATION.md](./COLLABORATION.md) を参照してください。

---

**作成日**: 2025年12月
**最終更新**: 2025年12月

## 🔄 最近の更新（2025年12月）

### 認証システムの実装
- ユーザーログイン・登録・ログアウト機能を実装
- Flask セッション管理による認証
- ログイン状態の自動チェック
- ログイン後、左上角にユーザー名を表示
- 管理者アカウント機能（email: `seika`）

### お気に入り機能の実装
- 店舗をお気に入りに追加/削除する機能
- お気に入り一覧ページの実装
- データベースに `user_favorites` テーブルを追加
- 検索結果画面、詳細ページ、お気に入り一覧から操作可能
- ピン追加時に自動的にお気に入りに追加（URL送信者）

### URL送信・ピン追加機能
- **URL送信機能**
  - すべてのユーザーが地図ページからURLを送信可能
  - 送信されたURLはデータベースに保存（`submitted_urls`テーブル）
  - 送信成功後、成功メッセージを表示
- **管理者ピン追加機能**
  - 管理者のみアクセス可能な「ピン追加」メニュー
  - URL一覧表示（時間順、最新が上）
  - URL選択後、店舗情報入力フォームを表示
  - 店舗追加成功後、対応するURLを自動削除
  - 追加した店舗はURL送信者のお気に入りに自動追加
  - 新規キーワードは自動的にキーワードデータベースに同期

### UI/UX の改善
- 店舗詳細ページ（90vh）の実装
- 画像カルーセルのマウスドラッグ対応
- 検索結果画面をオーバーレイ形式に変更
- 4つの評価項目（辛さ、清潔度、快適度、混雑度）を全画面で表示
- スクロールバーを非表示に（機能は維持）
- 最大幅を固定（デスクトップでも448pxに制限）
- ログイン後、ロックボタンを非表示（タイトルは表示）
- ピン追加ページの評価入力にスライダーUIを採用
- スライダーの視認性向上（柔らかい色調、適切なサイズ）

### データベース
- `user_favorites` テーブルの追加
- `submitted_urls` テーブルの追加（URL送信管理）
- ユーザー認証用の `users` テーブル拡張
- `shops` テーブルに `submitted_by_user_id` カラム追加

### モバイル対応・デプロイ
- すべてのサーバーをLANアクセス可能に設定（`host: '0.0.0.0'`）
- モバイルデバイスからのアクセス対応
- 詳細なモバイルデプロイガイド（`MOBILE_DEPLOY.md`）を追加

### コード最適化
- すべてのコメントを日本語に統一
- 不要なコードの削除と簡素化
- エラーハンドリングの改善
