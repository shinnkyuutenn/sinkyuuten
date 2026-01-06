from flask import Flask, request, jsonify, send_from_directory, send_file
from flask_cors import CORS
from models import search_shops
import db
from login import auth_bp
from recommend import recommend_bp
from add_shop import add_shop_bp
from review import auth_review
from review_aggregate import review_aggregate_bp
from articles import article_bp
from recommended_reviews import recommended_reviews_bp

import os

import psycopg2.extras


app = Flask(__name__, static_folder='dist', static_url_path='')
# CORS 設定：すべてのオリジンを許可（開発/モバイル環境用）
# 注意：supports_credentials=True の場合、origins="*" は使用できない
# そのため、after_request で動的に設定する
CORS(app, 
     supports_credentials=True,
     resources={r"/*": {
         "origins": "*",
         "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
         "allow_headers": ["Content-Type", "Authorization", "Accept", "X-Requested-With"],
         "expose_headers": ["Content-Type", "Authorization"]
     }})
app.secret_key = "your-secret-key"

# CORS ヘッダーを動的に設定（credentials: true の場合、Origin を * にできない）
@app.after_request
def after_request(response):
    origin = request.headers.get('Origin')
    if origin:
        response.headers.add('Access-Control-Allow-Origin', origin)
        response.headers.add('Access-Control-Allow-Credentials', 'true')
    return response

# 静态文件服务
@app.route("/static/uploads/<path:filename>")
def uploaded_file(filename):
    return send_from_directory("static/uploads", filename)

# ブループリント登録
app.register_blueprint(auth_bp, url_prefix="/auth")
app.register_blueprint(recommend_bp, url_prefix="/recommend")
app.register_blueprint(add_shop_bp, url_prefix="/shop")
app.register_blueprint(auth_review)
app.register_blueprint(review_aggregate_bp)
app.register_blueprint(article_bp)
app.register_blueprint(recommended_reviews_bp)



def to_int_or_none(value):
    try:
        return int(value) if value not in (None, "") else None
    except ValueError:
        return None


@app.route("/search_shops_json", methods=["GET"])
def search_shops_json():
    """店舗検索API"""
    keyword = request.args.get("keyword", '')
    keywords = request.args.get("keywords", '')
    shop_type = request.args.get("shop_type", '')
    city = request.args.get("city", '')

    min_spicy = to_int_or_none(request.args.get("min_spicy", 0))
    min_clean = to_int_or_none(request.args.get("min_clean", 0))
    min_comfort = to_int_or_none(request.args.get("min_comfort", 0))
    min_congestion = to_int_or_none(request.args.get("min_congestion", 0))
    sort_by = request.args.get("sort_by", "rating")
    sort_dir = request.args.get("sort_dir", "desc")

    shops = search_shops(
        keyword=keyword,
        keywords=keywords,
        shop_type=shop_type,
        city=city,
        min_spicy=min_spicy,
        min_clean=min_clean,
        min_comfort=min_comfort,
        min_congestion=min_congestion,
        sort_by=sort_by,
        sort_dir=sort_dir,
    )

    return jsonify(shops)


@app.route("/api/restaurants", methods=["GET", "OPTIONS"])
def get_restaurants():
    # CORS 预检请求处理
    if request.method == 'OPTIONS':
        response = jsonify({})
        # credentials: true を使用する場合、Origin を * にできない
        origin = request.headers.get('Origin', '*')
        response.headers.add('Access-Control-Allow-Origin', origin)
        response.headers.add('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response
    """全レストランデータ取得API（キーワード含む）"""
    try:
        conn = db.get_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("""
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
        """)
        restaurants = cur.fetchall()
        result = [dict(r) for r in restaurants]
        print(f"レストランデータ取得成功: {len(result)}件")
        response = jsonify(result)
        # CORS ヘッダーを追加（credentials: true を使用する場合、Origin を * にできない）
        origin = request.headers.get('Origin', '*')
        response.headers.add('Access-Control-Allow-Origin', origin)
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response
    except Exception as e:
        print(f"レストランデータ取得エラー: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"レストランデータ取得失敗: {str(e)}"}), 500
    finally:
        if 'conn' in locals():
            conn.close()

@app.route("/api/keywords", methods=["GET"])
def get_keywords():
    """全キーワード取得API"""
    conn = db.get_connection()
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("SELECT id, word FROM public.keywords ORDER BY word")
        keywords = cur.fetchall()
        return jsonify([dict(k) for k in keywords])
    except Exception as e:
        print(f"キーワード取得エラー: {e}")
        return jsonify({"error": "キーワード取得失敗"}), 500
    finally:
        conn.close()

# 前端静态文件服务（SPA路由支持）
# 注意：这个路由必须在所有API路由之后定义，否则会拦截API请求
@app.route("/", defaults={'path': ''})
@app.route("/<path:path>")
def serve_static(path):
    # 如果是API路径，不应该到达这里（应该在API路由中处理）
    # 但如果到达这里，说明API路由没有匹配，返回404
    if path.startswith(('api/', 'auth/', 'recommend/', 'shop/', 'review_json', 'search_shops_json', 'upload-image', 'articles')):
        from flask import abort
        abort(404)
    
    # 静态文件路径（static/）直接返回文件
    if path.startswith('static/'):
        # static/uploads/ 已经在上面单独处理
        # 其他 static/ 路径返回404或尝试从dist目录查找
        file_path = os.path.join("dist", path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return send_from_directory("dist", path)
        abort(404)
    
    # 检查是否是静态资源文件（assets目录等）
    if path:
        file_path = os.path.join("dist", path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return send_from_directory("dist", path)
    
    # 其他路径返回 index.html（SPA路由）
    return send_file("dist/index.html")


if __name__ == "__main__":
    # 生产环境：debug=False，开发环境：debug=True
    import sys
    debug_mode = '--debug' in sys.argv or os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    app.run(debug=debug_mode, host='0.0.0.0', port=5001)  # LANアクセス許可
