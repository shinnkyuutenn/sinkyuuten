import psycopg2
import os
from psycopg2.extras import RealDictCursor

def get_connection():
    """データベース接続を取得"""
    return psycopg2.connect(
        host=os.getenv('DB_HOST', 'localhost'),
        database=os.getenv('DB_NAME', 'india_reviews'),
        user=os.getenv('DB_USER', 'user'),
        password=os.getenv('DB_PASSWORD', ''),
        port=os.getenv('DB_PORT', '5432')
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

