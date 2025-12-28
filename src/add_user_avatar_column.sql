-- ユーザーテーブルにavatarカラムを追加
-- Add avatar column to users table

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS avatar VARCHAR(100);

COMMENT ON COLUMN public.users.avatar IS 'ユーザーアバター画像ファイル名（user_icon_1.png から user_icon_10.png まで）';

