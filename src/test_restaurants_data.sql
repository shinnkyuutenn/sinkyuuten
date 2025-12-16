-- テスト用レストランデータ挿入スクリプト
-- 3つのテスト用レストランデータ

-- ============================================
-- レストラン1: ハイデラバードの伝統的インドレストラン
-- ============================================
INSERT INTO public.shops (
    name, 
    shop_type, 
    spicy_level, 
    clean_level, 
    comfortable_level, 
    congestion_level, 
    avg_rating, 
    photo_url, 
    city_id,
    latitude,
    longitude
) VALUES (
    'Biryani Paradise',
    'restaurant',
    4,
    4,
    3,
    4,
    4.5,
    'https://example.com/images/biryani-paradise-1.jpg,https://example.com/images/biryani-paradise-2.jpg,https://example.com/images/biryani-paradise-3.jpg',
    'hyderabad',
    17.402000,
    78.508000
);

-- レストラン1のキーワード（キーワードを自動挿入して関連付け）
INSERT INTO public.keywords (word) VALUES ('ハイデラバード'), ('インド料理'), ('ビリヤニ'), ('伝統的')
ON CONFLICT (word) DO NOTHING;

INSERT INTO public.shop_keywords (shop_id, keyword_id) 
SELECT 1, k.id FROM public.keywords k 
WHERE k.word IN ('ハイデラバード', 'インド料理', 'ビリヤニ', '伝統的')
ON CONFLICT (shop_id, keyword_id) DO NOTHING;

-- ============================================
-- レストラン2: ムンバイのモダンなインドレストラン
-- ============================================
INSERT INTO public.shops (
    name, 
    shop_type, 
    spicy_level, 
    clean_level, 
    comfortable_level, 
    congestion_level, 
    avg_rating, 
    photo_url, 
    city_id,
    latitude,
    longitude
) VALUES (
    'Spice Garden Mumbai',
    'restaurant',
    3,
    5,
    4,
    3,
    4.8,
    'https://example.com/images/spice-garden.jpg',
    'mumbai',
    19.076090,
    72.877426
);

-- レストラン2のキーワード（キーワードを自動挿入して関連付け）
INSERT INTO public.keywords (word) VALUES ('ムンバイ'), ('インド料理'), ('高級'), ('モダン'), ('ファミリー向け')
ON CONFLICT (word) DO NOTHING;

INSERT INTO public.shop_keywords (shop_id, keyword_id) 
SELECT 2, k.id FROM public.keywords k 
WHERE k.word IN ('ムンバイ', 'インド料理', '高級', 'モダン', 'ファミリー向け')
ON CONFLICT (shop_id, keyword_id) DO NOTHING;

-- ============================================
-- レストラン3: ニューデリーのストリートフードレストラン
-- ============================================
INSERT INTO public.shops (
    name, 
    shop_type, 
    spicy_level, 
    clean_level, 
    comfortable_level, 
    congestion_level, 
    avg_rating, 
    photo_url, 
    city_id,
    latitude,
    longitude
) VALUES (
    'Delhi Street Food Corner',
    'restaurant',
    5,
    2,
    2,
    5,
    4.2,
    'https://example.com/images/delhi-street-food.jpg',
    'delhi',
    28.613939,
    77.209021
);

-- レストラン3のキーワード（キーワードを自動挿入して関連付け）
INSERT INTO public.keywords (word) VALUES ('ニューデリー'), ('インド料理'), ('ストリートフード'), ('辛い'), ('カジュアル')
ON CONFLICT (word) DO NOTHING;

INSERT INTO public.shop_keywords (shop_id, keyword_id) 
SELECT 3, k.id FROM public.keywords k 
WHERE k.word IN ('ニューデリー', 'インド料理', 'ストリートフード', '辛い', 'カジュアル')
ON CONFLICT (shop_id, keyword_id) DO NOTHING;

-- ============================================
-- ホテル1: ハイデラバードの高級ホテル
-- ============================================
INSERT INTO public.shops (
    name, 
    shop_type, 
    spicy_level, 
    clean_level, 
    comfortable_level, 
    congestion_level, 
    avg_rating, 
    photo_url, 
    city_id,
    latitude,
    longitude
) VALUES (
    'Hyderabad Grand Hotel',
    'hotel',
    1,
    5,
    5,
    2,
    4.7,
    'https://example.com/images/hyderabad-hotel-1.jpg,https://example.com/images/hyderabad-hotel-2.jpg,https://example.com/images/hyderabad-hotel-3.jpg',
    'hyderabad',
    17.423000,
    78.452000
);

-- ホテル1のキーワード（キーワードを自動挿入して関連付け）
INSERT INTO public.keywords (word) VALUES ('ハイデラバード'), ('ホテル'), ('高級'), ('快適'), ('ビジネス')
ON CONFLICT (word) DO NOTHING;

INSERT INTO public.shop_keywords (shop_id, keyword_id) 
SELECT 4, k.id FROM public.keywords k 
WHERE k.word IN ('ハイデラバード', 'ホテル', '高級', '快適', 'ビジネス')
ON CONFLICT (shop_id, keyword_id) DO NOTHING;

-- ============================================
-- スポット1: ハイデラバードの観光スポット
-- ============================================
INSERT INTO public.shops (
    name, 
    shop_type, 
    spicy_level, 
    clean_level, 
    comfortable_level, 
    congestion_level, 
    avg_rating, 
    photo_url, 
    city_id,
    latitude,
    longitude
) VALUES (
    'Charminar Heritage Site',
    'spot',
    1,
    4,
    3,
    5,
    4.6,
    'https://example.com/images/charminar-1.jpg,https://example.com/images/charminar-2.jpg,https://example.com/images/charminar-3.jpg',
    'hyderabad',
    17.361564,
    78.474673
);

-- スポット1のキーワード（キーワードを自動挿入して関連付け）
INSERT INTO public.keywords (word) VALUES ('ハイデラバード'), ('観光スポット'), ('歴史的'), ('文化'), ('人気')
ON CONFLICT (word) DO NOTHING;

INSERT INTO public.shop_keywords (shop_id, keyword_id) 
SELECT 5, k.id FROM public.keywords k 
WHERE k.word IN ('ハイデラバード', '観光スポット', '歴史的', '文化', '人気')
ON CONFLICT (shop_id, keyword_id) DO NOTHING;

INSERT INTO public.shops (
  name,
  shop_type,
  spicy_level,
  clean_level,
  comfortable_level,
  congestion_level,
  avg_rating,
  photo_url,
  city_id,
  latitude,
  longitude
) VALUES (
  'Lake District Bar & Kitchen',
  'Restaurant',
  0,
  0,
  0,
  0,
  0,
  'https://maps.app.goo.gl/b52sk86GNpKfJGMB8',
  'hyderabad',
  17.4223501,
  78.4651959
);

INSERT INTO public.keywords (word) VALUES ('ハイデラバード'), ('バー'), ('バーベキュー')
ON CONFLICT (word) DO NOTHING;

INSERT INTO public.shop_keywords (shop_id, keyword_id) 
SELECT 6, k.id FROM public.keywords k 
WHERE k.word IN ('ハイデラバード', 'バー', 'バーベキュー')
ON CONFLICT (shop_id, keyword_id) DO NOTHING;