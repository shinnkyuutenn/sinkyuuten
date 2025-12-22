import psycopg2
import os
from psycopg2.extras import RealDictCursor
from urllib.parse import urlparse
from pathlib import Path


def _load_dotenv_if_present():
    """
    Load .env in the project root without external deps.
    This avoids Flask's optional python-dotenv auto-load behavior (which may be missing),
    and ensures NEON_DATABASE_URL/DATABASE_URL is available for local dev.
    """
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
        # strip matching quotes
        if (val.startswith('"') and val.endswith('"')) or (val.startswith("'") and val.endswith("'")):
            val = val[1:-1]
        if key and key not in os.environ:
            os.environ[key] = val


_load_dotenv_if_present()

def get_connection():
    """データベース接続を取得（Neon 対応）"""
    # 优先使用连接字符串（Neon 推荐方式）
    database_url = os.getenv('NEON_DATABASE_URL') or os.getenv('DATABASE_URL')
    
    if database_url:
        # 解析连接字符串
        result = urlparse(database_url)
        return psycopg2.connect(
            host=result.hostname,
            database=result.path[1:] if result.path.startswith('/') else result.path,  # 移除前导斜杠
            user=result.username,
            password=result.password,
            port=result.port or 5432,
            sslmode='require'  # Neon 要求 SSL
        )
    else:
        # 使用环境变量（兼容本地开发）
        host = os.getenv('DB_HOST', 'localhost')
        return psycopg2.connect(
            host=host,
            database=os.getenv('DB_NAME', 'india_reviews'),
            user=os.getenv('DB_USER', 'user'),
            password=os.getenv('DB_PASSWORD', ''),
            port=os.getenv('DB_PORT', '5432'),
            sslmode='require' if 'neon.tech' in host else 'prefer'  # Neon 需要 SSL
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

