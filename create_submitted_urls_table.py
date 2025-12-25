"""
Neonデータベースにsubmitted_urlsテーブルを作成するスクリプト
"""
from db import get_connection

def create_submitted_urls_table():
    """submitted_urlsテーブルを作成"""
    db = get_connection()
    try:
        with db:
            cur = db.cursor()
            
            # テーブル作成
            cur.execute("""
                CREATE TABLE IF NOT EXISTS public.submitted_urls (
                    id SERIAL PRIMARY KEY,
                    url TEXT NOT NULL,
                    submitted_by_user_id INTEGER,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (submitted_by_user_id) REFERENCES public.users(id) ON DELETE SET NULL
                )
            """)
            
            # インデックス作成
            cur.execute("""
                CREATE INDEX IF NOT EXISTS idx_submitted_urls_created_at 
                ON public.submitted_urls(created_at DESC)
            """)
            
            # コメント追加
            cur.execute("""
                COMMENT ON TABLE public.submitted_urls IS 'ユーザーが送信したURLを保存するテーブル'
            """)
            cur.execute("""
                COMMENT ON COLUMN public.submitted_urls.url IS '送信されたURL'
            """)
            cur.execute("""
                COMMENT ON COLUMN public.submitted_urls.submitted_by_user_id IS 'URLを送信したユーザーID'
            """)
            cur.execute("""
                COMMENT ON COLUMN public.submitted_urls.created_at IS '送信日時'
            """)
            
            db.commit()
            print("✓ submitted_urlsテーブルを作成しました")
            
            # テーブルが存在するか確認
            cur.execute("""
                SELECT COUNT(*) 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'submitted_urls'
            """)
            exists = cur.fetchone()[0]
            if exists:
                print("✓ テーブルの確認が完了しました")
            else:
                print("✗ テーブルの作成に失敗しました")
                
    except Exception as e:
        db.rollback()
        print(f"✗ エラーが発生しました: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    print("submitted_urlsテーブルを作成中...")
    create_submitted_urls_table()
    print("完了しました！")

