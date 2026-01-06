#!/usr/bin/env python3
"""
users表からupdated_atトリガーを削除するスクリプト
"""
import sys
from db import get_connection

def remove_updated_at_trigger():
    """users表からupdated_atトリガーを削除"""
    try:
        conn = get_connection()
        with conn.cursor() as cur:
            # updated_atトリガーを削除
            cur.execute("DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;")
            conn.commit()
            print("✅ updated_atトリガーの削除が完了しました")
            return True
    except Exception as e:
        print(f"❌ エラーが発生しました: {e}")
        if conn:
            conn.rollback()
        return False
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    success = remove_updated_at_trigger()
    sys.exit(0 if success else 1)





