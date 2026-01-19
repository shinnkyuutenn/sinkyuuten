# Neon データベース移行ガイド

このガイドでは、Neon データベース間でデータを移行する方法を説明します。

## 📋 前提条件

- Python 3.11 以上
- `psycopg2` がインストールされている（`requirements.txt` に含まれています）
- ソースとターゲットの両方のデータベース接続文字列

## 🔧 移行手順

### 方法 1: 環境変数を使用（推奨）

#### ステップ 1: 接続文字列を取得

**ソースデータベース（移行元）:**
1. [Neon Console](https://console.neon.tech/app/projects/morning-credit-59057492?branchId=br-winter-math-a1bek1tk&database=neondb) にアクセス
2. **Connection Details** を開く
3. **Connection string** をコピー（例：`postgresql://user:password@host/dbname?sslmode=require`）

**ターゲットデータベース（移行先）:**
1. [Neon Console](https://console.neon.tech/app/projects/wild-recipe-63689290?branchId=br-summer-sun-ahcz0ndw) にアクセス
2. **Connection Details** を開く
3. **Connection string** をコピー

#### ステップ 2: 環境変数を設定

```bash
# ソースデータベース接続文字列
export SOURCE_NEON_DATABASE_URL="postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require"

# ターゲットデータベース接続文字列
export TARGET_NEON_DATABASE_URL="postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require"
```

#### ステップ 3: 移行スクリプトを実行

```bash
python3 migrate_neon_database.py
```

### 方法 2: 対話形式で実行

環境変数を設定せずに実行すると、対話形式で接続文字列を入力できます：

```bash
python3 migrate_neon_database.py
```

実行すると、以下のようにプロンプトが表示されます：

```
📥 ソースデータベース（移行元）の接続文字列を入力してください：
接続文字列: [ここに入力]
```

## 📊 移行されるデータ

スクリプトは以下のデータを移行します：

- ✅ すべてのテーブル
- ✅ すべての行データ
- ✅ データ型とカラム構造

**注意：**
- 既存のデータは **TRUNCATE** されます（削除されます）
- スキーマ（テーブル構造）は移行されません。ターゲットデータベースに同じスキーマが必要です
- 外部キー制約がある場合、依存関係を考慮して移行されます

## 🔍 スキーマの確認

移行前に、ターゲットデータベースに必要なスキーマが存在することを確認してください。

### スキーマを確認する方法

```bash
# ソースデータベースのスキーマをエクスポート
psql "SOURCE_CONNECTION_STRING" -c "\d" > source_schema.txt

# ターゲットデータベースのスキーマを確認
psql "TARGET_CONNECTION_STRING" -c "\d" > target_schema.txt
```

### スキーマを移行する方法

スキーマが異なる場合は、先にスキーマを移行してください：

```bash
# ソースデータベースからスキーマをダンプ
pg_dump "SOURCE_CONNECTION_STRING" --schema-only > schema.sql

# ターゲットデータベースにスキーマを適用
psql "TARGET_CONNECTION_STRING" < schema.sql
```

## ⚙️ Vercel 環境変数の更新

データ移行が完了したら、Vercel の環境変数を更新してください：

### ステップ 1: Vercel Dashboard にアクセス

1. [Vercel Dashboard](https://vercel.com/dashboard) にアクセス
2. プロジェクトを選択
3. **Settings** → **Environment Variables** を開く

### ステップ 2: 環境変数を更新

1. `NEON_DATABASE_URL` を探す
2. **Edit** をクリック
3. 新しいターゲットデータベースの接続文字列に更新
4. **Save** をクリック

### ステップ 3: 再デプロイ

環境変数を更新したら、再デプロイを実行：

```bash
# Vercel CLI を使用
vercel --prod

# または GitHub にプッシュ（CI/CD が自動デプロイ）
git commit --allow-empty -m "データベース移行後の再デプロイ"
git push origin main
```

## 🐛 トラブルシューティング

### エラー: "テーブルが見つかりません"

**原因**: ターゲットデータベースにスキーマが存在しない

**解決策**:
1. スキーマを先に移行する（上記参照）
2. または、ターゲットデータベースで `init_neon_db.py` を実行

### エラー: "外部キー制約違反"

**原因**: データの依存関係が正しく処理されていない

**解決策**:
1. 外部キー制約を一時的に無効化
2. データを移行
3. 外部キー制約を再有効化

### エラー: "接続タイムアウト"

**原因**: 接続文字列が間違っている、またはネットワーク問題

**解決策**:
1. 接続文字列を再確認
2. Neon Console で接続文字列を再生成
3. `pooler` エンドポイントを使用しているか確認

## 📝 注意事項

- ⚠️ **データのバックアップ**: 移行前に重要なデータのバックアップを取ってください
- ⚠️ **既存データの削除**: ターゲットデータベースの既存データは削除されます
- ⚠️ **ダウンタイム**: 移行中はアプリケーションを一時的に停止することを推奨します
- ✅ **テスト**: 移行後、アプリケーションが正常に動作するか確認してください

## 🔗 関連リンク

- [Neon Console - ソースデータベース](https://console.neon.tech/app/projects/morning-credit-59057492?branchId=br-winter-math-a1bek1tk&database=neondb)
- [Neon Console - ターゲットデータベース](https://console.neon.tech/app/projects/wild-recipe-63689290?branchId=br-summer-sun-ahcz0ndw)
- [VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md) - Vercel デプロイガイド

