-- URL送信テーブル
CREATE TABLE IF NOT EXISTS public.submitted_urls (
    id SERIAL PRIMARY KEY,
    url TEXT NOT NULL,
    submitted_by_user_id INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (submitted_by_user_id) REFERENCES public.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_submitted_urls_created_at ON public.submitted_urls(created_at DESC);

COMMENT ON TABLE public.submitted_urls IS 'ユーザーが送信したURLを保存するテーブル';
COMMENT ON COLUMN public.submitted_urls.url IS '送信されたURL';
COMMENT ON COLUMN public.submitted_urls.submitted_by_user_id IS 'URLを送信したユーザーID';
COMMENT ON COLUMN public.submitted_urls.created_at IS '送信日時';

