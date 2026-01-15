"""
店舗の評価フィールドをNULLにリセットするスクリプト
"""
import psycopg2
from db import get_connection
from pathlib import Path

def reset_shop_ratings():
    """店舗の評価フィールドをNULLにリセット"""
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        
        sql_script_path = Path(__file__).resolve().parent / "src" / "reset_shop_ratings.sql"
        with open(sql_script_path, 'r', encoding='utf-8') as f:
            sql_script = f.read()
        
        cur.execute(sql_script)
        conn.commit()
        print("✅ 店舗の評価フィールドをNULLにリセットしました")
        
    except Exception as e:
        print(f"❌ エラーが発生しました: {e}")
        import traceback
        traceback.print_exc()
        if conn:
            conn.rollback()
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    reset_shop_ratings()











