-- 修改 users_review 表的 spicy_level 字段，允许 NULL 值
-- 非餐厅类型的店铺（如酒店、景点）不需要填写辣度

ALTER TABLE public.users_review 
ALTER COLUMN spicy_level DROP NOT NULL;

COMMENT ON COLUMN public.users_review.spicy_level IS '辛さレベル（1-5、NULL = 非餐厅类型の場合は不要）';

