--
-- PostgreSQL Database Schema for India Reviews Application
-- インドレストランレビューアプリケーション用データベーススキーマ
-- Optimized version with indexes, constraints, and comments
-- インデックス、制約、コメント付き最適化版
--

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';
SET default_table_access_method = heap;

-- ============================================
-- SEQUENCES
-- ============================================

CREATE SEQUENCE public.shops_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE public.keywords_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

-- ============================================
-- TABLES
-- ============================================

--
-- Table: shops
-- Description: レストラン・店舗基本情報テーブル
--
CREATE TABLE public.shops (
    id integer NOT NULL DEFAULT nextval('public.shops_id_seq'::regclass),
    name VARCHAR(100) NOT NULL,
    shop_type VARCHAR(50),
    spicy_level integer CHECK (spicy_level >= 1 AND spicy_level <= 5),
    clean_level integer CHECK (clean_level >= 1 AND clean_level <= 5),
    comfortable_level integer CHECK (comfortable_level >= 1 AND comfortable_level <= 5),
    congestion_level integer CHECK (congestion_level >= 1 AND congestion_level <= 5),
    avg_rating NUMERIC(3,2) CHECK (avg_rating >= 0 AND avg_rating <= 5),
    photo_url VARCHAR(500),
    city_id VARCHAR(50) NOT NULL,
    latitude NUMERIC(10, 8) NOT NULL,
    longitude NUMERIC(11, 8) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT shops_pkey PRIMARY KEY (id)
);

COMMENT ON TABLE public.shops IS 'レストラン・店舗基本情報テーブル';
COMMENT ON COLUMN public.shops.id IS 'レストラン一意識別子';
COMMENT ON COLUMN public.shops.name IS 'レストラン名';
COMMENT ON COLUMN public.shops.shop_type IS '店舗タイプ（restaurant, hotel, spot等）';
COMMENT ON COLUMN public.shops.spicy_level IS '辛さレベル（1-5）';
COMMENT ON COLUMN public.shops.clean_level IS '清潔度レベル（1-5）';
COMMENT ON COLUMN public.shops.comfortable_level IS '快適度レベル（1-5）';
COMMENT ON COLUMN public.shops.congestion_level IS '混雑度レベル（1-5、1が最も空いている）';
COMMENT ON COLUMN public.shops.avg_rating IS '平均評価（0-5）';
COMMENT ON COLUMN public.shops.city_id IS '都市ID';
COMMENT ON COLUMN public.shops.latitude IS '緯度';
COMMENT ON COLUMN public.shops.longitude IS '経度';

--
-- Table: keywords
-- Description: キーワードテーブル、レストランタグと検索に使用
--
CREATE TABLE public.keywords (
    id integer NOT NULL DEFAULT nextval('public.keywords_id_seq'::regclass),
    word VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT keywords_pkey PRIMARY KEY (id),
    CONSTRAINT keywords_word_key UNIQUE (word)
);

COMMENT ON TABLE public.keywords IS 'キーワードテーブル、レストランタグと検索機能に使用';
COMMENT ON COLUMN public.keywords.id IS 'キーワード一意識別子';
COMMENT ON COLUMN public.keywords.word IS 'キーワード内容（一意）';

--
-- Table: shop_keywords
-- Description: レストランとキーワードの関連テーブル（多対多関係）
--
CREATE TABLE public.shop_keywords (
    shop_id integer NOT NULL,
    keyword_id integer NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT shop_keywords_pkey PRIMARY KEY (shop_id, keyword_id),
    CONSTRAINT shop_keywords_shop_id_fkey FOREIGN KEY (shop_id) 
        REFERENCES public.shops(id) ON DELETE CASCADE,
    CONSTRAINT shop_keywords_keyword_id_fkey FOREIGN KEY (keyword_id) 
        REFERENCES public.keywords(id) ON DELETE CASCADE
);

COMMENT ON TABLE public.shop_keywords IS 'レストランとキーワードの関連テーブル（多対多関係）';
COMMENT ON COLUMN public.shop_keywords.shop_id IS 'レストランID';
COMMENT ON COLUMN public.shop_keywords.keyword_id IS 'キーワードID';

--
-- Table: users
-- Description: ユーザー情報テーブル
--
CREATE TABLE public.users (
    id integer NOT NULL DEFAULT nextval('public.users_id_seq'::regclass),
    email TEXT NOT NULL,
    name VARCHAR(100) NOT NULL,
    password_hash TEXT NOT NULL,
    spicy_level integer CHECK (spicy_level >= 1 AND spicy_level <= 5),
    clean_level integer CHECK (clean_level >= 1 AND clean_level <= 5),
    comfortable_level integer CHECK (comfortable_level >= 1 AND comfortable_level <= 5),
    congestion_level integer CHECK (congestion_level >= 1 AND congestion_level <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT users_pkey PRIMARY KEY (id),
    CONSTRAINT users_email_key UNIQUE (email)
);

COMMENT ON TABLE public.users IS 'ユーザー情報テーブル';
COMMENT ON COLUMN public.users.id IS 'ユーザー一意識別子';
COMMENT ON COLUMN public.users.email IS 'ユーザーメールアドレス（一意）';
COMMENT ON COLUMN public.users.name IS 'ユーザー名';
COMMENT ON COLUMN public.users.password_hash IS 'パスワードハッシュ値';
COMMENT ON COLUMN public.users.spicy_level IS 'ユーザー好みの辛さレベル（1-5）';
COMMENT ON COLUMN public.users.clean_level IS 'ユーザー好みの清潔度レベル（1-5）';
COMMENT ON COLUMN public.users.comfortable_level IS 'ユーザー好みの快適度レベル（1-5）';
COMMENT ON COLUMN public.users.congestion_level IS 'ユーザー好みの混雑度レベル（1-5）';

-- ============================================
-- INDEXES (パフォーマンス最適化)
-- ============================================

-- shopsテーブルインデックス
CREATE INDEX idx_shops_city_id ON public.shops(city_id);
CREATE INDEX idx_shops_shop_type ON public.shops(shop_type);
CREATE INDEX idx_shops_avg_rating ON public.shops(avg_rating DESC);
CREATE INDEX idx_shops_latitude ON public.shops(latitude);
CREATE INDEX idx_shops_longitude ON public.shops(longitude);
CREATE INDEX idx_shops_spicy_level ON public.shops(spicy_level);
CREATE INDEX idx_shops_clean_level ON public.shops(clean_level);
CREATE INDEX idx_shops_comfortable_level ON public.shops(comfortable_level);
CREATE INDEX idx_shops_congestion_level ON public.shops(congestion_level);
-- 複合インデックス（よく使われるクエリの組み合わせ用）
CREATE INDEX idx_shops_city_rating ON public.shops(city_id, avg_rating DESC);

-- keywordsテーブルインデックス（wordはUNIQUE制約により自動的に一意インデックスが作成される）
-- あいまい検索が必要な場合は、先にpg_trgm拡張を有効化：
-- CREATE EXTENSION IF NOT EXISTS pg_trgm;
-- CREATE INDEX idx_keywords_word_trgm ON public.keywords USING gin (word gin_trgm_ops);

-- shop_keywordsテーブルインデックス（JOIN最適化用）
CREATE INDEX idx_shop_keywords_shop_id ON public.shop_keywords(shop_id);
CREATE INDEX idx_shop_keywords_keyword_id ON public.shop_keywords(keyword_id);

-- usersテーブルインデックス
CREATE INDEX idx_users_email ON public.users(email);

-- ============================================
-- FUNCTIONS (自動更新タイムスタンプ)
-- ============================================

-- updated_atを自動更新する関数を作成
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- shopsテーブルに自動更新トリガーを追加
CREATE TRIGGER update_shops_updated_at BEFORE UPDATE ON public.shops
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- usersテーブルに自動更新トリガーを追加
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- データマイグレーション（既存データベース用）
-- ============================================

-- 既存のshopsテーブルに座標フィールドを追加する場合（既に存在する場合はスキップ）
-- 注意: 新しいデータベースを作成する場合は、上記のCREATE TABLE文で既に含まれているため不要
DO $$
BEGIN
    -- latitudeフィールドを追加（存在しない場合）
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'shops' 
        AND column_name = 'latitude'
    ) THEN
        ALTER TABLE public.shops ADD COLUMN latitude NUMERIC(10, 8);
        COMMENT ON COLUMN public.shops.latitude IS 'レストラン緯度座標';
    END IF;

    -- longitudeフィールドを追加（存在しない場合）
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'shops' 
        AND column_name = 'longitude'
    ) THEN
        ALTER TABLE public.shops ADD COLUMN longitude NUMERIC(11, 8);
        COMMENT ON COLUMN public.shops.longitude IS 'レストラン経度座標';
    END IF;
    
    -- 既存のフィールドがDOUBLE PRECISION型の場合はNUMERICに変更（オプション）
    -- 注意: データ型の変更は慎重に行ってください
    -- ALTER TABLE public.shops ALTER COLUMN latitude TYPE NUMERIC(10, 8) USING latitude::NUMERIC(10, 8);
    -- ALTER TABLE public.shops ALTER COLUMN longitude TYPE NUMERIC(11, 8) USING longitude::NUMERIC(11, 8);
END $$;

-- 既存データにデフォルト座標を設定（座標がNULLの場合のみ）
-- ハイデラバード (Hyderabad)
UPDATE public.shops 
SET latitude = 17.385044, longitude = 78.486671 
WHERE city_id = 'hyderabad' AND (latitude IS NULL OR longitude IS NULL);

-- ムンバイ (Mumbai)
UPDATE public.shops 
SET latitude = 19.076090, longitude = 72.877426 
WHERE city_id = 'mumbai' AND (latitude IS NULL OR longitude IS NULL);

-- ニューデリー (Delhi)
UPDATE public.shops 
SET latitude = 28.613939, longitude = 77.209021 
WHERE city_id = 'delhi' AND (latitude IS NULL OR longitude IS NULL);

-- ============================================
-- 初期データ投入（キーワード）
-- ============================================

-- キーワードデータを追加（既に存在する場合はスキップ）
-- このスクリプトは一般的なキーワードを追加し、キーワード検索機能の実装を容易にします
INSERT INTO public.keywords (word)
SELECT word FROM (VALUES 
  ('タイ料理'),
  ('四川料理'),
  ('高級'),
  ('ハイデラバード'),
  ('ムンバイ'),
  ('ニューデリー'),
  ('インド料理'),
  ('ビリヤニ'),
  ('ストリートフード'),
  ('伝統的'),
  ('モダン'),
  ('辛い'),
  ('カジュアル'),
  ('ファミリー向け'),
  ('中華料理'),
  ('和食'),
  ('イタリアン'),
  ('フレンチ'),
  ('ベジタリアン'),
  ('ビーガン'),
  ('ハラル'),
  ('予算内'),
  ('デート向け'),
  ('ビジネス'),
  ('ランチ'),
  ('ディナー'),
  ('朝食'),
  ('バー'),
  ('カフェ'),
  ('スイーツ')
) AS v(word)
WHERE NOT EXISTS (SELECT 1 FROM public.keywords WHERE keywords.word = v.word);

-- 挿入されたキーワードを表示（オプション）
-- SELECT id, word FROM public.keywords ORDER BY word;

-- ============================================
-- オプション拡張機能（必要に応じて有効化）
-- ============================================

-- pg_trgm拡張を有効化してキーワードのあいまい検索を行う（オプション）
-- 使用前に実行: CREATE EXTENSION IF NOT EXISTS pg_trgm;
-- その後、以下のコメントを解除して全文検索インデックスを作成:
-- CREATE INDEX idx_keywords_word_trgm ON public.keywords USING gin (word gin_trgm_ops);

-- PostGIS拡張を有効化して高度な地理的位置情報クエリを行う（オプション）
-- 使用前に実行: CREATE EXTENSION IF NOT EXISTS postgis;
-- その後、空間インデックスを作成可能:
-- CREATE INDEX idx_shops_location_gist ON public.shops USING GIST (ST_MakePoint(longitude, latitude));
