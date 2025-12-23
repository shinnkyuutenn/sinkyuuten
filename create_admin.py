#!/usr/bin/env python3
"""
管理者アカウント作成スクリプト
"""
from db import get_connection
from login import hash_password

def create_admin_user():
    """管理者アカウントを作成"""
    email = "seika"
    name = "seika"
    password = "123456"
    
    # パスワードをハッシュ化
    password_hash = hash_password(password)
    
    # デフォルトの評価項目（すべて3）
    spicy_level = 3
    clean_level = 3
    comfortable_level = 3
    congestion_level = 3
    
    db = get_connection()
    try:
        with db:
            cur = db.cursor()
            
            # 既存ユーザーをチェック
            cur.execute("SELECT id FROM users WHERE email = %s", (email,))
            existing = cur.fetchone()
            
            if existing:
                print(f"ユーザー '{email}' は既に存在します（ID: {existing[0]}）")
                # パスワードを更新
                cur.execute(
                    "UPDATE users SET password_hash = %s WHERE email = %s",
                    (password_hash, email)
                )
                db.commit()
                print(f"パスワードを更新しました")
                return
            
            # 新規ユーザーを作成
            cur.execute(
                """
                INSERT INTO users
                (name, email, password_hash,
                 spicy_level, clean_level, comfortable_level, congestion_level)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                RETURNING id
                """,
                (name, email, password_hash,
                 spicy_level, clean_level, comfortable_level, congestion_level)
            )
            user_id = cur.fetchone()[0]
            db.commit()
            print(f"管理者アカウントを作成しました:")
            print(f"  - ユーザーID: {user_id}")
            print(f"  - メールアドレス: {email}")
            print(f"  - パスワード: {password}")
            print(f"  - 名前: {name}")
            
    except Exception as e:
        print(f"エラー: {e}")
        raise

if __name__ == "__main__":
    create_admin_user()

