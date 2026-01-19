# CI/CD セットアップガイド

このプロジェクトには GitHub Actions を使用した CI/CD パイプラインが設定されています。

## 📋 概要

CI/CD パイプラインは以下の機能を提供します：

1. **自動ビルドとテスト**：コードがプッシュされるたびに自動的にビルドとテストを実行
2. **自動デプロイ**：`main` ブランチへのプッシュ時に自動的に Vercel にデプロイ

## 🔧 セットアップ手順

### 1. GitHub Secrets の設定

GitHub リポジトリの **Settings → Secrets and variables → Actions** で以下のシークレットを追加してください：

#### 必須シークレット

**`VERCEL_TOKEN`**
- Vercel のアクセストークン
- 取得方法：
  1. [Vercel Dashboard](https://vercel.com/account/tokens) にアクセス
  2. "Create Token" をクリック
  3. トークン名を入力（例：`github-actions`）
  4. トークンをコピーして GitHub Secrets に追加

**`VERCEL_ORG_ID`**
- Vercel の組織ID
- 取得方法：
  1. Vercel プロジェクトの Settings → General
  2. "Project ID" の下に "Organization ID" が表示されます
  3. または、Vercel CLI で `vercel link` を実行すると `.vercel/project.json` に保存されます

**`VERCEL_PROJECT_ID`**
- Vercel のプロジェクトID
- 取得方法：
  1. Vercel プロジェクトの Settings → General
  2. "Project ID" が表示されます
  3. または、Vercel CLI で `vercel link` を実行すると `.vercel/project.json` に保存されます

### 2. ワークフローの確認

`.github/workflows/deploy.yml` ファイルが正しく作成されていることを確認してください。

### 3. 初回実行

`main` ブランチにプッシュすると、自動的に CI/CD パイプラインが実行されます：

```bash
git add .
git commit -m "Add CI/CD pipeline"
git push origin main
```

## 🔄 ワークフローの動作

### ビルドとテスト（すべてのプッシュ/PR）

1. **コードチェックアウト**
2. **Python 環境セットアップ**（Python 3.11）
3. **Node.js 環境セットアップ**（Node.js 20）
4. **依存関係のインストール**
   - Python: `pip install -r requirements.txt`
   - Node.js: `npm ci`
5. **フロントエンドビルド**
   - `npm run build`
6. **ビルド出力の確認**
7. **Python コードのリント**（オプション）

### デプロイ（main ブランチへのプッシュのみ）

1. **ビルドジョブの成功を待機**
2. **Vercel CLI のインストール**
3. **フロントエンドのビルド**
4. **Vercel へのデプロイ**
   - 本番環境（`--prod`）に自動デプロイ

## 📊 ワークフローの確認

GitHub リポジトリの **Actions** タブで、ワークフローの実行状況を確認できます：

- ✅ 緑色：成功
- ❌ 赤色：失敗
- 🟡 黄色：実行中

## 🐛 トラブルシューティング

### デプロイが失敗する場合

1. **Secrets の確認**
   - `VERCEL_TOKEN`、`VERCEL_ORG_ID`、`VERCEL_PROJECT_ID` が正しく設定されているか確認

2. **ビルドエラーの確認**
   - Actions タブでエラーログを確認
   - ローカルで `npm run build` が成功するか確認

3. **Vercel プロジェクトの確認**
   - Vercel ダッシュボードでプロジェクトが存在するか確認
   - 環境変数（`NEON_DATABASE_URL` など）が設定されているか確認

### ビルドが失敗する場合

1. **依存関係の確認**
   - `requirements.txt` と `package.json` が最新か確認
   - ローカルで `npm ci` と `pip install -r requirements.txt` が成功するか確認

2. **コードエラーの確認**
   - リントエラーがないか確認
   - 構文エラーがないか確認

## 🔐 セキュリティ

- **Secrets の管理**：機密情報は GitHub Secrets に保存し、コードに直接書かないでください
- **環境変数**：Vercel の環境変数も GitHub Secrets とは別に管理されています

## 📝 カスタマイズ

ワークフローをカスタマイズする場合は、`.github/workflows/deploy.yml` を編集してください。

### 例：テストの追加

```yaml
- name: Run tests
  run: |
    npm test
    pytest
```

### 例：通知の追加

```yaml
- name: Notify on failure
  if: failure()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    text: 'Deployment failed!'
```

## 🔗 関連ドキュメント

- [GitHub Actions ドキュメント](https://docs.github.com/en/actions)
- [Vercel CLI ドキュメント](https://vercel.com/docs/cli)
- [VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md) - Vercel デプロイの詳細ガイド

