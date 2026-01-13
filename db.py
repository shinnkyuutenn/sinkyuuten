import psycopg2
import os
from psycopg2.extras import RealDictCursor
from urllib.parse import urlparse
from pathlib import Path


def _load_dotenv_if_present():
    """プロジェクトルートの.envファイルを読み込む（外部依存なし）"""
    env_path = Path(__file__).resolve().parent / ".env"
    if not env_path.exists():
        return
    try:
        content = env_path.read_text(encoding="utf-8")
    except Exception:
        return

    for raw_line in content.splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#"):
            continue
        if line.startswith("export "):
            line = line[len("export ") :].strip()
        if "=" not in line:
            continue
        key, val = line.split("=", 1)
        key = key.strip()
        val = val.strip()
        # 引用符を除去
        if (val.startswith('"') and val.endswith('"')) or (val.startswith("'") and val.endswith("'")):
            val = val[1:-1]
        if key and key not in os.environ:
            os.environ[key] = val


_load_dotenv_if_present()

def get_connection():
    """データベース接続を取得（Neon対応）"""
    database_url = os.getenv('NEON_DATABASE_URL') or os.getenv('DATABASE_URL')
    
    # デバッグ用: 環境変数の存在を確認（パスワードは表示しない）
    has_url = bool(database_url)
    print(f"データベース接続情報: NEON_DATABASE_URL={'設定済み' if os.getenv('NEON_DATABASE_URL') else '未設定'}, DATABASE_URL={'設定済み' if os.getenv('DATABASE_URL') else '未設定'}")
    
    if database_url:
        # 接続文字列を使用（Neon推奨）
        # channel_binding=require を除去（psycopg2 がサポートしていない場合がある）
        clean_url = database_url.replace('&channel_binding=require', '').replace('?channel_binding=require', '')
        # 直接接続文字列を使用（psycopg2 が自動的にパースする）
        try:
            # psycopg2.connect() は接続文字列を直接受け取れる
            # Vercel環境ではsslmodeを指定しない方が良い場合がある
            conn = psycopg2.connect(clean_url)
            print("✅ データベース接続成功（接続文字列使用）")
            return conn
        except Exception as e:
            print(f"⚠️ 接続文字列での接続失敗: {e}")
            # フォールバック: 手動パース
            try:
                result = urlparse(clean_url)
                conn = psycopg2.connect(
                    host=result.hostname,
                    database=result.path[1:] if result.path.startswith('/') else result.path,
                    user=result.username,
                    password=result.password,
                    port=result.port or 5432,
                    sslmode='require'
                )
                print("✅ データベース接続成功（手動パース使用）")
                return conn
            except Exception as e2:
                # エラーログを出力
                print(f"❌ データベース接続エラー（手動パース）: {e2}")
                import traceback
                traceback.print_exc()
                raise
    else:
        # 環境変数を使用（ローカル開発用）
        host = os.getenv('DB_HOST', 'localhost')
        print(f"⚠️ 接続文字列が未設定、個別環境変数を使用: host={host}")
        try:
            conn = psycopg2.connect(
                host=host,
                database=os.getenv('DB_NAME', 'india_reviews'),
                user=os.getenv('DB_USER', 'user'),
                password=os.getenv('DB_PASSWORD', ''),
                port=os.getenv('DB_PORT', '5432'),
                sslmode='require' if 'neon.tech' in host else 'prefer'
            )
            print("✅ データベース接続成功（個別環境変数使用）")
            return conn
        except Exception as e:
            print(f"❌ データベース接続エラー（個別環境変数）: {e}")
            import traceback
            traceback.print_exc()
            raise

def query(sql, params=None):
    """SQLクエリを実行して結果を返す"""
    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(sql, params or [])
            return cur.fetchall()
    finally:
        conn.close()

