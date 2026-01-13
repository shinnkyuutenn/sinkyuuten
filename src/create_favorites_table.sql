-- お気に入りテーブル作成
CREATE TABLE IF NOT EXISTS public.user_favorites (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    shop_id INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT user_favorites_user_id_fkey FOREIGN KEY (user_id) 
        REFERENCES public.users(id) ON DELETE CASCADE,
    CONSTRAINT user_favorites_shop_id_fkey FOREIGN KEY (shop_id) 
        REFERENCES public.shops(id) ON DELETE CASCADE,
    CONSTRAINT user_favorites_unique UNIQUE (user_id, shop_id)
);

CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON public.user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_shop_id ON public.user_favorites(shop_id);

COMMENT ON TABLE public.user_favorites IS 'ユーザーのお気に入り店舗テーブル';
COMMENT ON COLUMN public.user_favorites.user_id IS 'ユーザーID';
COMMENT ON COLUMN public.user_favorites.shop_id IS '店舗ID';









