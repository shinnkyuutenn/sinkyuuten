-- テスト用データ投入スクリプト（Neon / 既存DBでも壊れにくい版）
-- - shops の採番（id）に依存しないように、各ブロックで shop_id を取得して関連付けします
-- - 既に同名 + 同都市の店舗が存在する場合は、その id を使ってキーワードを紐付けます（重複INSERT回避）

-- ============================================
-- レストラン1: ハイデラバードの伝統的インドレストラン
-- ============================================
WITH existing_shop AS (
  SELECT id
  FROM public.shops
  WHERE name = 'Biryani Paradise' AND city_id = 'hyderabad'
  ORDER BY id DESC
  LIMIT 1
),
inserted_shop AS (
  INSERT INTO public.shops (
    name, shop_type, spicy_level, clean_level, comfortable_level, congestion_level,
    avg_rating, photo_url, city_id, latitude, longitude
  )
  SELECT
    'Biryani Paradise',
    'restaurant',
    4, 4, 3, 4,
    4.5,
    'https://example.com/images/biryani-paradise-1.jpg,https://example.com/images/biryani-paradise-2.jpg,https://example.com/images/biryani-paradise-3.jpg',
    'hyderabad',
    17.402000,
    78.508000
  WHERE NOT EXISTS (SELECT 1 FROM existing_shop)
  RETURNING id
),
shop AS (
  SELECT id FROM inserted_shop
  UNION ALL
  SELECT id FROM existing_shop
),
kw_insert AS (
  INSERT INTO public.keywords (word)
  SELECT unnest(ARRAY['ハイデラバード', 'インド料理', 'ビリヤニ', '伝統的'])
  ON CONFLICT (word) DO NOTHING
  RETURNING id
)
INSERT INTO public.shop_keywords (shop_id, keyword_id)
SELECT shop.id, k.id
FROM shop
JOIN public.keywords k ON k.word = ANY(ARRAY['ハイデラバード', 'インド料理', 'ビリヤニ', '伝統的'])
ON CONFLICT (shop_id, keyword_id) DO NOTHING;

-- ============================================
-- レストラン2: ムンバイのモダンなインドレストラン
-- ============================================
WITH existing_shop AS (
  SELECT id
  FROM public.shops
  WHERE name = 'Spice Garden Mumbai' AND city_id = 'mumbai'
  ORDER BY id DESC
  LIMIT 1
),
inserted_shop AS (
  INSERT INTO public.shops (
    name, shop_type, spicy_level, clean_level, comfortable_level, congestion_level,
    avg_rating, photo_url, city_id, latitude, longitude
  )
  SELECT
    'Spice Garden Mumbai',
    'restaurant',
    3, 5, 4, 3,
    4.8,
    'https://example.com/images/spice-garden.jpg',
    'mumbai',
    19.076090,
    72.877426
  WHERE NOT EXISTS (SELECT 1 FROM existing_shop)
  RETURNING id
),
shop AS (
  SELECT id FROM inserted_shop
  UNION ALL
  SELECT id FROM existing_shop
),
kw_insert AS (
  INSERT INTO public.keywords (word)
  SELECT unnest(ARRAY['ムンバイ', 'インド料理', '高級', 'モダン', 'ファミリー向け'])
  ON CONFLICT (word) DO NOTHING
  RETURNING id
)
INSERT INTO public.shop_keywords (shop_id, keyword_id)
SELECT shop.id, k.id
FROM shop
JOIN public.keywords k ON k.word = ANY(ARRAY['ムンバイ', 'インド料理', '高級', 'モダン', 'ファミリー向け'])
ON CONFLICT (shop_id, keyword_id) DO NOTHING;

-- ============================================
-- レストラン3: ニューデリーのストリートフードレストラン
-- ============================================
WITH existing_shop AS (
  SELECT id
  FROM public.shops
  WHERE name = 'Delhi Street Food Corner' AND city_id = 'delhi'
  ORDER BY id DESC
  LIMIT 1
),
inserted_shop AS (
  INSERT INTO public.shops (
    name, shop_type, spicy_level, clean_level, comfortable_level, congestion_level,
    avg_rating, photo_url, city_id, latitude, longitude
  )
  SELECT
    'Delhi Street Food Corner',
    'restaurant',
    5, 2, 2, 5,
    4.2,
    'https://example.com/images/delhi-street-food.jpg',
    'delhi',
    28.613939,
    77.209021
  WHERE NOT EXISTS (SELECT 1 FROM existing_shop)
  RETURNING id
),
shop AS (
  SELECT id FROM inserted_shop
  UNION ALL
  SELECT id FROM existing_shop
),
kw_insert AS (
  INSERT INTO public.keywords (word)
  SELECT unnest(ARRAY['ニューデリー', 'インド料理', 'ストリートフード', '辛い', 'カジュアル'])
  ON CONFLICT (word) DO NOTHING
  RETURNING id
)
INSERT INTO public.shop_keywords (shop_id, keyword_id)
SELECT shop.id, k.id
FROM shop
JOIN public.keywords k ON k.word = ANY(ARRAY['ニューデリー', 'インド料理', 'ストリートフード', '辛い', 'カジュアル'])
ON CONFLICT (shop_id, keyword_id) DO NOTHING;

-- ============================================
-- ホテル1: ハイデラバードの高級ホテル
-- ============================================
WITH existing_shop AS (
  SELECT id
  FROM public.shops
  WHERE name = 'Hyderabad Grand Hotel' AND city_id = 'hyderabad'
  ORDER BY id DESC
  LIMIT 1
),
inserted_shop AS (
  INSERT INTO public.shops (
    name, shop_type, spicy_level, clean_level, comfortable_level, congestion_level,
    avg_rating, photo_url, city_id, latitude, longitude
  )
  SELECT
    'Hyderabad Grand Hotel',
    'hotel',
    1, 5, 5, 2,
    4.7,
    'https://example.com/images/hyderabad-hotel-1.jpg,https://example.com/images/hyderabad-hotel-2.jpg,https://example.com/images/hyderabad-hotel-3.jpg',
    'hyderabad',
    17.423000,
    78.452000
  WHERE NOT EXISTS (SELECT 1 FROM existing_shop)
  RETURNING id
),
shop AS (
  SELECT id FROM inserted_shop
  UNION ALL
  SELECT id FROM existing_shop
),
kw_insert AS (
  INSERT INTO public.keywords (word)
  SELECT unnest(ARRAY['ハイデラバード', 'ホテル', '高級', '快適', 'ビジネス'])
  ON CONFLICT (word) DO NOTHING
  RETURNING id
)
INSERT INTO public.shop_keywords (shop_id, keyword_id)
SELECT shop.id, k.id
FROM shop
JOIN public.keywords k ON k.word = ANY(ARRAY['ハイデラバード', 'ホテル', '高級', '快適', 'ビジネス'])
ON CONFLICT (shop_id, keyword_id) DO NOTHING;

-- ============================================
-- スポット1: ハイデラバードの観光スポット
-- ============================================
WITH existing_shop AS (
  SELECT id
  FROM public.shops
  WHERE name = 'Charminar Heritage Site' AND city_id = 'hyderabad'
  ORDER BY id DESC
  LIMIT 1
),
inserted_shop AS (
  INSERT INTO public.shops (
    name, shop_type, spicy_level, clean_level, comfortable_level, congestion_level,
    avg_rating, photo_url, city_id, latitude, longitude
  )
  SELECT
    'Charminar Heritage Site',
    'spot',
    1, 4, 3, 5,
    4.6,
    'https://example.com/images/charminar-1.jpg,https://example.com/images/charminar-2.jpg,https://example.com/images/charminar-3.jpg',
    'hyderabad',
    17.361564,
    78.474673
  WHERE NOT EXISTS (SELECT 1 FROM existing_shop)
  RETURNING id
),
shop AS (
  SELECT id FROM inserted_shop
  UNION ALL
  SELECT id FROM existing_shop
),
kw_insert AS (
  INSERT INTO public.keywords (word)
  SELECT unnest(ARRAY['ハイデラバード', '観光スポット', '歴史的', '文化', '人気'])
  ON CONFLICT (word) DO NOTHING
  RETURNING id
)
INSERT INTO public.shop_keywords (shop_id, keyword_id)
SELECT shop.id, k.id
FROM shop
JOIN public.keywords k ON k.word = ANY(ARRAY['ハイデラバード', '観光スポット', '歴史的', '文化', '人気'])
ON CONFLICT (shop_id, keyword_id) DO NOTHING;

-- ============================================
-- レストラン4: 追加データ（レベル不明は NULL）
-- ============================================
WITH existing_shop AS (
  SELECT id
  FROM public.shops
  WHERE name = 'Lake District Bar & Kitchen' AND city_id = 'hyderabad'
  ORDER BY id DESC
  LIMIT 1
),
inserted_shop AS (
  INSERT INTO public.shops (
    name, shop_type, spicy_level, clean_level, comfortable_level, congestion_level,
    avg_rating, photo_url, city_id, latitude, longitude
  )
  SELECT
    'Lake District Bar & Kitchen',
    'restaurant',
    NULL, NULL, NULL, NULL,
    NULL,
    'http://lh3.googleusercontent.com/gps-cs-s/AG0ilSxE4340s1n1VZ0NohwFyqtL1LWSKBkqJRKd8mFY40tVsZZHMh4UOEuJ3KSECbepy_Ab3REUjY-HmDrUmh9PoaIVuT1Cnjx6KU0DXPfYZkkSqv3x20wvLDcwQswuAI5KHeoWI8NQ=w344-h448-p-k-no',
    'hyderabad',
    17.4223501,
    78.4651959
  WHERE NOT EXISTS (SELECT 1 FROM existing_shop)
  RETURNING id
),
shop AS (
  SELECT id FROM inserted_shop
  UNION ALL
  SELECT id FROM existing_shop
),
kw_insert AS (
  INSERT INTO public.keywords (word)
  SELECT unnest(ARRAY['ハイデラバード', 'バー', 'バーベキュー'])
  ON CONFLICT (word) DO NOTHING
  RETURNING id
)
INSERT INTO public.shop_keywords (shop_id, keyword_id)
SELECT shop.id, k.id
FROM shop
JOIN public.keywords k ON k.word = ANY(ARRAY['ハイデラバード', 'バー', 'バーベキュー'])
ON CONFLICT (shop_id, keyword_id) DO NOTHING;