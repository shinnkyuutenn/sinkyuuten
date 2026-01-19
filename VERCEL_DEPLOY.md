# Vercel デプロイガイド

このドキュメントでは、侍インドレビュー（SIR）アプリを Vercel にデプロイする手順を説明します。

## 📋 前提条件

- Vercel アカウント（[vercel.com](https://vercel.com) で無料登録可能）
- Neon PostgreSQL データベース（または他の PostgreSQL データベース）
- GitHub リポジトリ（オプション、自動デプロイ用）

## 🔧 環境変数の設定

### 1. Vercel ダッシュボードで環境変数を設定

Vercel プロジェクトの **Settings → Environment Variables** で以下の環境変数を追加してください：

#### 必須環境変数

**`NEON_DATABASE_URL`** または **`DATABASE_URL`**
```
postgresql://neondb_owner:npg_OAtX7RldPb3L@ep-snowy-star-a1ncts7u-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

**注意：**
- `channel_binding=require` パラメータは自動的に除去されます（`db.py` で処理）
- Neon の **pooler** エンドポイントを使用することを推奨します（接続プーリング対応）

#### オプション環境変数

**`GOOGLE_MAPS_API_KEY`**
- Google Maps API キー（デフォルト値が設定されている場合は省略可能）
- カスタム API キーを使用する場合に設定

### 2. 環境変数の適用範囲

各環境変数に対して、以下の環境を選択できます：
- **Production**（本番環境）
- **Preview**（プレビュー環境、PR など）
- **Development**（開発環境）

すべての環境で同じ値を使用する場合は、すべてのチェックボックスを選択してください。

## 🚀 デプロイ方法

### 方法 1: Vercel CLI を使用（推奨）

#### 1. Vercel CLI のインストール

```bash
npm i -g vercel
```

#### 2. ログイン

```bash
vercel login
```

#### 3. プロジェクトをデプロイ

```bash
# プロジェクトディレクトリに移動
cd /path/to/sinkyuuten

# 初回デプロイ（対話形式で設定）
vercel

# 本番環境にデプロイ
vercel --prod
```

#### 4. 環境変数の設定（CLI 経由）

```bash
# 環境変数を設定
vercel env add NEON_DATABASE_URL production

# 値を入力（対話形式）
# postgresql://neondb_owner:npg_OAtX7RldPb3L@ep-snowy-star-a1ncts7u-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

### 方法 2: GitHub リポジトリを接続（自動デプロイ）

#### 1. Vercel ダッシュボードでプロジェクトを作成

1. [Vercel Dashboard](https://vercel.com/dashboard) にログイン
2. **Add New Project** をクリック
3. GitHub リポジトリを選択またはインポート
4. プロジェクト設定を確認

#### 2. 環境変数を設定

**Settings → Environment Variables** で環境変数を追加（上記参照）

#### 3. デプロイ

- `main` ブランチへの push で自動的に本番環境にデプロイ
- 他のブランチへの push でプレビュー環境にデプロイ

## 📁 プロジェクト構造

Vercel デプロイ用のファイル：

```
sinkyuuten/
├── vercel.json          # Vercel 設定ファイル
├── api/
│   └── index.py         # Serverless function wrapper
├── requirements.txt     # Python 依存関係
├── package.json         # Node.js 依存関係
└── dist/                # ビルドされたフロントエンド（自動生成）
```

## ⚙️ 設定ファイルの説明

### `vercel.json`

- **builds**: Flask アプリを `@vercel/python` runtime でビルド
- **routes**: API ルートを `api/index.py` にルーティング
- **static files**: `dist/` ディレクトリから静的ファイルを配信

### `api/index.py`

- Flask アプリを Vercel Python runtime 用にラップ
- WSGI 環境を構築して Flask アプリに渡す
- Vercel の serverless function 形式でレスポンスを返す

## 🔍 トラブルシューティング

### データベース接続エラー

**問題：** `psycopg2.OperationalError` または接続タイムアウト

**解決策：**
1. `NEON_DATABASE_URL` が正しく設定されているか確認
2. Neon の **pooler** エンドポイントを使用しているか確認（`-pooler` が URL に含まれている）
3. `channel_binding=require` パラメータが自動除去されているか確認（`db.py` で処理）

### モジュールインポートエラー

**問題：** `ModuleNotFoundError` または `ImportError`

**解決策：**
1. `requirements.txt` に必要なパッケージがすべて含まれているか確認
2. Vercel のビルドログを確認して、依存関係が正しくインストールされているか確認

### CORS エラー

**問題：** フロントエンドから API へのリクエストがブロックされる

**解決策：**
1. `app.py` の CORS 設定を確認
2. Vercel のドメインが CORS 設定に含まれているか確認

### 静的ファイルが表示されない

**問題：** フロントエンドのアセット（画像、CSS、JS）が読み込まれない

**解決策：**
1. `npm run build` を実行して `dist/` ディレクトリを生成
2. `vercel.json` の `routes` 設定を確認
3. 静的ファイルのパスが正しいか確認

## 📝 注意事項

### Vercel 無料プランの制限

- **Serverless Function 実行時間**: 10秒（Hobby プラン）
- **月間実行時間**: 100時間（Hobby プラン）
- **帯域幅**: 100GB/月（Hobby プラン）

長時間実行される処理（データベースクエリなど）は最適化が必要な場合があります。

### データベース接続プーリング

Neon の **pooler** エンドポイントを使用することを強く推奨します：
- 接続プーリングにより、同時接続数を効率的に管理
- Serverless function のコールドスタート時の接続確立を高速化

### セッション管理

Vercel の serverless function はステートレスです。セッション管理には以下を使用：
- Flask session（cookie ベース）
- 外部セッションストア（Redis など、オプション）

## 🔗 関連リンク

- [Vercel ドキュメント](https://vercel.com/docs)
- [Vercel Python Runtime](https://vercel.com/docs/functions/runtimes/python)
- [Neon PostgreSQL](https://neon.tech)
- [Flask ドキュメント](https://flask.palletsprojects.com/)

## 📞 サポート

問題が発生した場合は、以下を確認してください：
1. Vercel のデプロイログ
2. ブラウザのコンソールエラー
3. サーバーログ（Vercel ダッシュボードの Functions タブ）

