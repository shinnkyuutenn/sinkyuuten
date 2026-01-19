# Vercel 環境変数修正ガイド

## 🔍 問題の原因

コードは以下の環境変数を優先的に使用します：
1. `NEON_DATABASE_URL`（優先）
2. `DATABASE_URL`（フォールバック）

Vercel で設定した他の環境変数（`POSTGRES_HOST`, `POSTGRES_URL` など）は使用されません。

## ✅ 解決方法

### ステップ 1: 正しい環境変数を設定

Vercel Dashboard で以下を設定してください：

**環境変数名**: `NEON_DATABASE_URL` または `DATABASE_URL`

**値**: 新しいデータベースの接続文字列
```
postgresql://neondb_owner:npg_zoFsc06qRBgP@ep-hidden-tree-ahj25r0p-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require
```

**重要**:
- `channel_binding=require` は含めても含めなくてもOK（コードで自動除去されます）
- **すべての環境**（Production, Preview, Development）に適用することを確認

### ステップ 2: 環境変数の確認

Vercel Dashboard で以下を確認：

1. **Settings** → **Environment Variables**
2. `NEON_DATABASE_URL` または `DATABASE_URL` が存在するか確認
3. 値が新しいデータベースの接続文字列か確認
4. **All Environments** にチェックが入っているか確認

### ステップ 3: 再デプロイ

環境変数を変更した後は、**必ず再デプロイ**が必要です：

**方法 A: Vercel Dashboard から**
1. **Deployments** タブを開く
2. 最新のデプロイメントの **"..."** メニューをクリック
3. **"Redeploy"** を選択

**方法 B: GitHub にプッシュ**
```bash
git commit --allow-empty -m "環境変数更新後の再デプロイ"
git push origin main
```

**方法 C: Vercel CLI**
```bash
vercel --prod
```

## 🔧 トラブルシューティング

### エラーが続く場合

1. **Vercel のログを確認**
   - Vercel Dashboard → **Deployments** → 最新のデプロイメント → **"Functions"** タブ
   - エラーログを確認し、データベース接続エラーの詳細を確認

2. **環境変数の値を再確認**
   - 接続文字列に余分なスペースや改行がないか確認
   - Neon Console で接続文字列を再生成してコピー

3. **接続文字列の形式を確認**
   - 正しい形式: `postgresql://user:password@host/database?sslmode=require`
   - `pooler` エンドポイントを使用しているか確認

## 📝 不要な環境変数の削除（オプション）

以下の環境変数は使用されないため、削除しても問題ありません：
- `POSTGRES_HOST`
- `POSTGRES_URL`
- `POSTGRES_PRISMA_URL`
- `DATABASE_URL_UNPOOLED`
- `POSTGRES_URL_NON_POOLING`
- `PGHOST`
- `POSTGRES_USER`
- `NEON_PROJECT_ID`

ただし、削除しなくても問題ありません（無視されます）。

## ✅ 確認チェックリスト

- [ ] `NEON_DATABASE_URL` または `DATABASE_URL` が設定されている
- [ ] 値が新しいデータベースの接続文字列である
- [ ] **All Environments** にチェックが入っている
- [ ] 再デプロイを実行した
- [ ] エラーが解消された

