-- 重置所有店铺的评分字段为NULL
UPDATE public.shops
SET 
    spicy_level = NULL,
    clean_level = NULL,
    comfortable_level = NULL,
    congestion_level = NULL,
    avg_rating = NULL;

COMMENT ON COLUMN public.shops.spicy_level IS '辛さレベル（1-5、NULL = 未設定、ユーザーレビューの平均から自動計算）';
COMMENT ON COLUMN public.shops.clean_level IS '清潔度レベル（1-5、NULL = 未設定、ユーザーレビューの平均から自動計算）';
COMMENT ON COLUMN public.shops.comfortable_level IS '快適度レベル（1-5、NULL = 未設定、ユーザーレビューの平均から自動計算）';
COMMENT ON COLUMN public.shops.congestion_level IS '混雑度レベル（1-5、NULL = 未設定、ユーザーレビューの平均から自動計算）';
COMMENT ON COLUMN public.shops.avg_rating IS '平均評価（0-5、NULL = 未設定、ユーザーレビューの平均から自動計算）';

