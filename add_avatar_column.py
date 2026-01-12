#!/usr/bin/env python3
"""
ユーザーテーブルにavatarカラムを追加するスクリプト
"""
import sys
from db import get_connection

def add_avatar_column():
    """usersテーブルにavatarカラムを追加"""
    try:
        conn = get_connection()
        with conn.cursor() as cur:
            # avatarカラムを追加
            cur.execute("""
                ALTER TABLE public.users 
                ADD COLUMN IF NOT EXISTS avatar VARCHAR(100);
            """)
            
            # コメントを追加
            cur.execute("""
                COMMENT ON COLUMN public.users.avatar IS 'ユーザーアバター画像ファイル名（user_icon_1.png から user_icon_10.png まで）';
            """)
            
            conn.commit()
            print("✅ avatarカラムの追加が完了しました")
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
    success = add_avatar_column()
    sys.exit(0 if success else 1)







