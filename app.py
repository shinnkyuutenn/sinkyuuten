from flask import Flask, request, jsonify
from flask_cors import CORS
from models import search_shops
import db
from login import auth_bp
from recommend import recommend_bp
from add_shop import add_shop_bp
from review import auth_review
from review_aggregate import review_aggregate_bp
from articles import article_bp

import psycopg2.extras


app = Flask(__name__)
CORS(app, supports_credentials=True)
app.secret_key = "your-secret-key"

# ブループリント登録
app.register_blueprint(auth_bp, url_prefix="/auth")
app.register_blueprint(recommend_bp, url_prefix="/recommend")
app.register_blueprint(add_shop_bp, url_prefix="/shop")
app.register_blueprint(auth_review)
app.register_blueprint(review_aggregate_bp)
app.register_blueprint(article_bp)


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


@app.route("/api/restaurants", methods=["GET"])
def get_restaurants():
    """全レストランデータ取得API（キーワード含む）"""
    conn = db.get_connection()
    try:
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
        return jsonify([dict(r) for r in restaurants])
    except Exception as e:
        print(f"レストランデータ取得エラー: {e}")
        return jsonify({"error": "レストランデータ取得失敗"}), 500
    finally:
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

@app.route("/")
def health():
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=5001)  # LANアクセス許可
