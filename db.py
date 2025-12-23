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
    
    if database_url:
        # 接続文字列を使用（Neon推奨）
        result = urlparse(database_url)
        return psycopg2.connect(
            host=result.hostname,
            database=result.path[1:] if result.path.startswith('/') else result.path,
            user=result.username,
            password=result.password,
            port=result.port or 5432,
            sslmode='require'
        )
    else:
        # 環境変数を使用（ローカル開発用）
        host = os.getenv('DB_HOST', 'localhost')
        return psycopg2.connect(
            host=host,
            database=os.getenv('DB_NAME', 'india_reviews'),
            user=os.getenv('DB_USER', 'user'),
            password=os.getenv('DB_PASSWORD', ''),
            port=os.getenv('DB_PORT', '5432'),
            sslmode='require' if 'neon.tech' in host else 'prefer'
        )

def query(sql, params=None):
    """SQLクエリを実行して結果を返す"""
    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(sql, params or [])
            return cur.fetchall()
    finally:
        conn.close()

