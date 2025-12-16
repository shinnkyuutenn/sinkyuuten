// 简单的 Express 服务器，用于从 PostgreSQL 数据库获取餐厅数据
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const port = 3001;

// 启用 CORS
app.use(cors());
app.use(express.json());

// PostgreSQL 数据库连接配置
// 请根据您的实际数据库配置修改这些值
const pool = new Pool({
  user: process.env.DB_USER || 'user',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'india_reviews',
  password: process.env.DB_PASSWORD || '',
  port: process.env.DB_PORT || 5432,
});

// 测试数据库连接
pool.on('connect', () => {
  console.log('数据库连接成功');
});

pool.on('error', (err) => {
  console.error('数据库连接错误:', err);
});

// 获取所有餐厅的 API 端点（包含关键词）
app.get('/api/restaurants', async (req, res) => {
  try {
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
      GROUP BY s.id, s.name, s.shop_type, s.spicy_level, s.clean_level, 
               s.comfortable_level, s.congestion_level, s.avg_rating, 
               s.photo_url, s.city_id, s.latitude, s.longitude
      ORDER BY s.id
    `;
    const result = await pool.query(query);
    
    // 添加调试信息
    console.log('查询结果总数:', result.rows.length);
    const typeCount = result.rows.reduce((acc, row) => {
      acc[row.shop_type] = (acc[row.shop_type] || 0) + 1;
      return acc;
    }, {});
    console.log('数据类型统计:', typeCount);
    console.log('所有shop_type值:', result.rows.map(r => ({ id: r.id, name: r.name, shop_type: r.shop_type })));
    
    res.json(result.rows);
  } catch (error) {
    console.error('获取餐厅数据错误:', error);
    res.status(500).json({ error: '获取餐厅数据失败' });
  }
});

// 根据城市 ID 获取餐厅的 API 端点（包含关键词）
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
    console.error('获取餐厅数据错误:', error);
    res.status(500).json({ error: '获取餐厅数据失败' });
  }
});

// 根据筛选条件获取餐厅的 API 端点（包含关键词）
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
    console.error('获取餐厅数据错误:', error);
    res.status(500).json({ error: '获取餐厅数据失败' });
  }
});

// 根据关键词搜索餐厅的 API 端点
app.get('/api/restaurants/search', async (req, res) => {
  try {
    const { keyword } = req.query;
    if (!keyword) {
      return res.status(400).json({ error: '关键词参数是必需的' });
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
    console.error('搜索餐厅数据错误:', error);
    res.status(500).json({ error: '搜索餐厅数据失败' });
  }
});

// 获取所有关键词的 API 端点
app.get('/api/keywords', async (req, res) => {
  try {
    const query = 'SELECT id, word FROM public.keywords ORDER BY word';
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('获取关键词错误:', error);
    res.status(500).json({ error: '获取关键词失败' });
  }
});

// 健康检查端点
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// 添加测试端点：检查数据库中的shop_type分布
app.get('/api/debug/shop-types', async (req, res) => {
  try {
    const query = `
      SELECT shop_type, COUNT(*) as count 
      FROM public.shops 
      GROUP BY shop_type
      ORDER BY shop_type
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('查询shop_type错误:', error);
    res.status(500).json({ error: '查询失败' });
  }
});

app.listen(port, () => {
  console.log(`服务器运行在 http://localhost:${port}`);
});

