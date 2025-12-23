// Expressサーバー：PostgreSQLからレストランデータを取得
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// .envファイルを読み込む（追加依存関係なし）
function loadDotEnvIfPresent() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, 'utf8');
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const normalized = line.startsWith('export ') ? line.slice('export '.length).trim() : line;
    const idx = normalized.indexOf('=');
    if (idx === -1) continue;
    const key = normalized.slice(0, idx).trim();
    let val = normalized.slice(idx + 1).trim();
    // 引用符を除去
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (key && process.env[key] === undefined) {
      process.env[key] = val;
    }
  }
}

function sanitizeDatabaseUrl(url) {
  if (!url) return url;
  // Neon URLのchannel_binding=requireを除去（互換性のため）
  return url
    .replace(/([?&])channel_binding=require(&|$)/, (m, sep, tail) => (tail ? sep : ''))
    .replace('?&', '?')
    .replace(/[?&]$/, '');
}

loadDotEnvIfPresent();

const app = express();
const port = 3001;

// CORS有効化
app.use(cors());
app.use(express.json());

// PostgreSQL接続設定（Neon優先、ローカルはフォールバック）
const pool = new Pool(
  process.env.NEON_DATABASE_URL || process.env.DATABASE_URL
    ? {
        connectionString: sanitizeDatabaseUrl(process.env.NEON_DATABASE_URL || process.env.DATABASE_URL),
        ssl: { rejectUnauthorized: false }
      }
    : {
        user: process.env.DB_USER || 'user',
        host: process.env.DB_HOST || 'localhost',
        database: process.env.DB_NAME || 'india_reviews',
        password: process.env.DB_PASSWORD || '',
        port: process.env.DB_PORT || 5432,
      }
);

const DEBUG_LOGS = process.env.DEBUG === '1' || process.env.DEBUG === 'true';

// データベース接続イベント
pool.on('connect', () => {
  if (DEBUG_LOGS) console.log('データベース接続成功');
});

pool.on('error', (err) => {
  console.error('データベース接続エラー:', err);
});

// 全レストランデータ取得API（キーワード含む）
app.get('/api/restaurants', async (req, res) => {
  try {
    const query = `
      SELECT 
        s.id, s.name, s.shop_type, s.spicy_level, s.clean_level, 
        s.comfortable_level, s.congestion_level,
        (s.avg_rating)::float8 as avg_rating,
        s.photo_url, s.city_id,
        (s.latitude)::float8 as latitude,
        (s.longitude)::float8 as longitude,
        COALESCE(
          json_agg(DISTINCT k.word) FILTER (WHERE k.word IS NOT NULL),
          '[]'::json
        ) as keywords
      FROM public.shops s
      LEFT JOIN public.shop_keywords sk ON s.id = sk.shop_id
      LEFT JOIN public.keywords k ON sk.keyword_id = k.id
      GROUP BY s.id, s.name, s.shop_type, s.spicy_level, s.clean_level, 
               s.comfortable_level, s.congestion_level, s.avg_rating, 
               s.photo_url, s.city_id, s.latitude, s.longitude
      ORDER BY s.id
    `;
    const result = await pool.query(query);
    if (DEBUG_LOGS) {
      console.log('クエリ結果数:', result.rows.length);
      const typeCount = result.rows.reduce((acc, row) => {
        acc[row.shop_type] = (acc[row.shop_type] || 0) + 1;
        return acc;
      }, {});
      console.log('データタイプ統計:', typeCount);
    }
    
    res.json(result.rows);
  } catch (error) {
    console.error('レストランデータ取得エラー:', error);
    res.status(500).json({ error: 'レストランデータ取得失敗' });
  }
});

// 都市ID別レストランデータ取得API（キーワード含む）
app.get('/api/restaurants/city/:cityId', async (req, res) => {
  try {
    const { cityId } = req.params;
    const query = `
      SELECT 
        s.id, s.name, s.shop_type, s.spicy_level, s.clean_level, 
        s.comfortable_level, s.congestion_level, s.avg_rating, 
        s.photo_url, s.city_id, s.latitude, s.longitude,
        COALESCE(
          json_agg(DISTINCT k.word) FILTER (WHERE k.word IS NOT NULL),
          '[]'::json
        ) as keywords
      FROM public.shops s
      LEFT JOIN public.shop_keywords sk ON s.id = sk.shop_id
      LEFT JOIN public.keywords k ON sk.keyword_id = k.id
      WHERE s.city_id = $1
      GROUP BY s.id, s.name, s.shop_type, s.spicy_level, s.clean_level, 
               s.comfortable_level, s.congestion_level, s.avg_rating, 
               s.photo_url, s.city_id, s.latitude, s.longitude
      ORDER BY s.id
    `;
    const result = await pool.query(query, [cityId]);
    res.json(result.rows);
  } catch (error) {
    console.error('レストランデータ取得エラー:', error);
    res.status(500).json({ error: 'レストランデータ取得失敗' });
  }
});

// フィルター条件別レストランデータ取得API（キーワード含む）
app.get('/api/restaurants/filter', async (req, res) => {
  try {
    const { city_id, shop_type, spicy_level, clean_level, comfortable_level, congestion_level, keyword } = req.query;
    
    let query = `
      SELECT 
        s.id, s.name, s.shop_type, s.spicy_level, s.clean_level, 
        s.comfortable_level, s.congestion_level, s.avg_rating, 
        s.photo_url, s.city_id, s.latitude, s.longitude,
        COALESCE(
          json_agg(DISTINCT k.word) FILTER (WHERE k.word IS NOT NULL),
          '[]'::json
        ) as keywords
      FROM public.shops s
      LEFT JOIN public.shop_keywords sk ON s.id = sk.shop_id
      LEFT JOIN public.keywords k ON sk.keyword_id = k.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (city_id) {
      query += ` AND s.city_id = $${paramCount++}`;
      params.push(city_id);
    }

    if (shop_type) {
      query += ` AND s.shop_type = $${paramCount++}`;
      params.push(shop_type);
    }

    if (spicy_level) {
      query += ` AND s.spicy_level >= $${paramCount++}`;
      params.push(parseInt(spicy_level));
    }

    if (clean_level) {
      query += ` AND s.clean_level >= $${paramCount++}`;
      params.push(parseInt(clean_level));
    }

    if (comfortable_level) {
      query += ` AND s.comfortable_level >= $${paramCount++}`;
      params.push(parseInt(comfortable_level));
    }

    if (congestion_level) {
      query += ` AND s.congestion_level <= $${paramCount++}`;
      params.push(parseInt(congestion_level));
    }

    if (keyword) {
      query += ` AND EXISTS (
        SELECT 1 FROM public.shop_keywords sk2
        JOIN public.keywords k2 ON sk2.keyword_id = k2.id
        WHERE sk2.shop_id = s.id AND k2.word = $${paramCount++}
      )`;
      params.push(keyword);
    }

    query += ` GROUP BY s.id, s.name, s.shop_type, s.spicy_level, s.clean_level, 
               s.comfortable_level, s.congestion_level, s.avg_rating, 
               s.photo_url, s.city_id, s.latitude, s.longitude 
               ORDER BY s.avg_rating DESC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('レストランデータ取得エラー:', error);
    res.status(500).json({ error: 'レストランデータ取得失敗' });
  }
});

// キーワード検索API
app.get('/api/restaurants/search', async (req, res) => {
  try {
    const { keyword } = req.query;
    if (!keyword) {
      return res.status(400).json({ error: 'キーワードパラメータが必要です' });
    }
    
    const query = `
      SELECT 
        s.id, s.name, s.shop_type, s.spicy_level, s.clean_level, 
        s.comfortable_level, s.congestion_level, s.avg_rating, 
        s.photo_url, s.city_id, s.latitude, s.longitude,
        COALESCE(
          json_agg(DISTINCT k.word) FILTER (WHERE k.word IS NOT NULL),
          '[]'::json
        ) as keywords
      FROM public.shops s
      INNER JOIN public.shop_keywords sk ON s.id = sk.shop_id
      INNER JOIN public.keywords k ON sk.keyword_id = k.id
      WHERE k.word ILIKE $1
      GROUP BY s.id, s.name, s.shop_type, s.spicy_level, s.clean_level, 
               s.comfortable_level, s.congestion_level, s.avg_rating, 
               s.photo_url, s.city_id, s.latitude, s.longitude
      ORDER BY s.avg_rating DESC
    `;
    const result = await pool.query(query, [`%${keyword}%`]);
    res.json(result.rows);
  } catch (error) {
    console.error('レストラン検索エラー:', error);
    res.status(500).json({ error: 'レストラン検索失敗' });
  }
});

// 全キーワード取得API
app.get('/api/keywords', async (req, res) => {
  try {
    const query = 'SELECT id, word FROM public.keywords ORDER BY word';
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('キーワード取得エラー:', error);
    res.status(500).json({ error: 'キーワード取得失敗' });
  }
});

// ヘルスチェック
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`サーバー起動: http://localhost:${port}`);
  console.log(`LANアクセス: http://172.27.176.118:${port}`);
});

