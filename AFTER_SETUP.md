# Secrets 設定後の確認手順

GitHub Secrets を設定した後、以下の手順で動作確認を行います。

## ✅ 設定確認チェックリスト

### 1. GitHub Secrets の確認

GitHub リポジトリの **Settings → Secrets and variables → Actions** で以下が設定されているか確認：

- ✅ `VERCEL_TOKEN`
- ✅ `VERCEL_ORG_ID`
- ✅ `VERCEL_PROJECT_ID`

### 2. Vercel 環境変数の確認

Vercel Dashboard で以下が設定されているか確認：

- ✅ `NEON_DATABASE_URL`（データベース接続文字列）

## 🚀 動作確認手順

### ステップ 1: テストコミットをプッシュ

小さな変更を加えて、CI/CD パイプラインをトリガーします：

```bash
# 現在のディレクトリで
cd /Users/user/Desktop/精华/2025/4Q/sinkyuuten

# 小さな変更を加える（例：README にコメント追加）
echo "" >> README.md
echo "<!-- CI/CD configured -->" >> README.md

# コミットとプッシュ
git add README.md
git commit -m "CI/CD動作確認"
git push origin main
```

### ステップ 2: GitHub Actions を確認

1. GitHub リポジトリの **Actions** タブを開く
2. 最新のワークフロー実行を確認
3. 以下のジョブが表示されることを確認：
   - ✅ **build-and-test** - ビルドとテスト（緑色 = 成功）
   - ✅ **deploy** - Vercel へのデプロイ（緑色 = 成功）

### ステップ 3: ワークフローの詳細を確認

各ジョブをクリックして、以下を確認：

#### build-and-test ジョブ
- ✅ コードチェックアウト成功
- ✅ Python 環境セットアップ成功
- ✅ Node.js 環境セットアップ成功
- ✅ 依存関係インストール成功
- ✅ フロントエンドビルド成功
- ✅ ビルド出力確認成功

#### deploy ジョブ
- ✅ Vercel CLI インストール成功
- ✅ フロントエンドビルド成功
- ✅ Vercel へのデプロイ成功

### ステップ 4: Vercel で確認

1. [Vercel Dashboard](https://vercel.com/dashboard) にアクセス
2. プロジェクトを選択
3. **"Deployments"** タブを確認
4. 新しいデプロイメントが作成されていることを確認
5. デプロイメントのステータスが **"Ready"** になっていることを確認

### ステップ 5: 本番環境で動作確認

1. Vercel のデプロイメント URL を開く
2. アプリケーションが正常に動作するか確認：
   - ✅ ページが正常に読み込まれる
   - ✅ データベース接続が正常（レストラン一覧が表示される）
   - ✅ API エンドポイントが正常に動作

## 🔍 トラブルシューティング

### 問題 1: デプロイジョブが表示されない

**原因**: Secrets が正しく設定されていない

**解決策**:
1. GitHub Secrets で3つの Secrets がすべて設定されているか確認
2. 名前が完全に一致しているか確認（大文字小文字も含む）
3. ワークフローファイル（`.github/workflows/deploy.yml`）を確認

### 問題 2: デプロイが失敗する

**原因**: Vercel の認証情報が間違っている

**解決策**:
1. `VERCEL_TOKEN` が有効か確認（新しいトークンを作成）
2. `VERCEL_ORG_ID` と `VERCEL_PROJECT_ID` が正しいか確認
3. Vercel Dashboard でプロジェクトが存在するか確認

### 問題 3: ビルドは成功するがデプロイされない

**原因**: Secrets の条件チェックでスキップされている

**解決策**:
1. ワークフローのログで "Skip deployment" メッセージを確認
2. `VERCEL_TOKEN` が空でないか確認
3. ブランチが `main` か確認

### 問題 4: デプロイは成功するがアプリが動作しない

**原因**: Vercel の環境変数が設定されていない

**解決策**:
1. Vercel Dashboard → Settings → Environment Variables
2. `NEON_DATABASE_URL` が設定されているか確認
3. 環境変数が **Production** 環境に適用されているか確認

## 📊 正常な動作フロー

設定が正しく完了すると、以下のフローが自動的に実行されます：

```
コードを main ブランチにプッシュ
    ↓
GitHub Actions が自動的にトリガー
    ↓
build-and-test ジョブ実行
    ├─ コードチェックアウト
    ├─ 依存関係インストール
    ├─ フロントエンドビルド
    └─ ビルド検証
    ↓
deploy ジョブ実行（build-and-test 成功後）
    ├─ Vercel CLI インストール
    ├─ フロントエンドビルド
    └─ Vercel にデプロイ
    ↓
Vercel で本番環境にデプロイ完了
    ↓
アプリケーションが利用可能
```

## 🎯 次のステップ

### 1. 自動デプロイの確認

今後、`main` ブランチにプッシュするたびに、自動的に：
- ✅ ビルドとテストが実行される
- ✅ Vercel に自動デプロイされる

### 2. プレビューデプロイ（オプション）

Pull Request を作成すると、プレビュー環境にも自動デプロイされます（Vercel の設定による）。

### 3. モニタリング

- **GitHub Actions**: すべてのワークフロー実行を監視
- **Vercel Dashboard**: デプロイメントの状態とログを確認
- **アプリケーション**: 本番環境での動作を監視

## 📝 よくある質問

### Q: 毎回デプロイされるの？

A: `main` ブランチにプッシュするたびに自動デプロイされます。他のブランチへのプッシュではビルドとテストのみ実行されます。

### Q: デプロイをスキップしたい場合は？

A: コミットメッセージに `[skip ci]` または `[skip deploy]` を含めると、ワークフローがスキップされます。

### Q: デプロイに時間がかかる場合は？

A: 通常、ビルドとデプロイに 2-5 分かかります。初回は依存関係のインストールで時間がかかる場合があります。

### Q: エラーが発生した場合は？

A: GitHub Actions のログを確認し、エラーメッセージに従って対処してください。詳細は `CI_CD_SETUP.md` のトラブルシューティングセクションを参照してください。

## 🔗 関連ドキュメント

- [CI_CD_SETUP.md](./CI_CD_SETUP.md) - CI/CD の詳細ガイド
- [GITHUB_SECRETS_SETUP.md](./GITHUB_SECRETS_SETUP.md) - Secrets 設定の詳細
- [VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md) - Vercel デプロイの詳細

