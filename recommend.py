from flask import Blueprint, jsonify, session
from db import get_connection
import psycopg2.extras


recommend_bp = Blueprint("recommend", __name__)

MAX_DIFF_PER_AXIS = 2
MAX_AVG_DIFF = 1.25

@recommend_bp.route("/recommend_places", methods=["GET"])
def recommend_places():
    if "user_id" not in session:
        return jsonify({"ok": False, "error": "ログインしてください"}), 401

    db = get_connection()
    try:
        cur = db.cursor(cursor_factory=psycopg2.extras.DictCursor)

        cur.execute("""
            SELECT spicy_level, clean_level, comfortable_level, congestion_level
            FROM users
            WHERE id = %s
        """, (session["user_id"],))
        user = cur.fetchone()

        if not user:
            return jsonify({"ok": False, "error": "ユーザーが見つかりません"}), 404

        # ユーザーの設定がない場合は推薦できない
        if not user["clean_level"] or not user["comfortable_level"] or not user["congestion_level"]:
            return jsonify({
                "ok": True,
                "places": []
            })

        # 店舗データを取得（キーワード含む）
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
        """)
        shops = cur.fetchall()

        results = []

        for shop in shops:
            diffs = []

            # レストランの場合のみ辛さレベルを考慮
            if shop["shop_type"] == "restaurant":
                user_spicy = user["spicy_level"] or 3
                shop_spicy = shop["spicy_level"] or 3
                diffs.append(abs(user_spicy - shop_spicy))

            # 清潔度、快適度、混雑度の差を計算（NULLの場合は3をデフォルト値として使用）
            user_clean = user["clean_level"] or 3
            shop_clean = shop["clean_level"] or 3
            diffs.append(abs(user_clean - shop_clean))

            user_comfort = user["comfortable_level"] or 3
            shop_comfort = shop["comfortable_level"] or 3
            diffs.append(abs(user_comfort - shop_comfort))

            user_congestion = user["congestion_level"] or 3
            shop_congestion = shop["congestion_level"] or 3
            diffs.append(abs(user_congestion - shop_congestion))

            # 各軸の最大差が閾値を超える場合は除外
            if max(diffs) > MAX_DIFF_PER_AXIS:
                continue

            # 平均差が閾値を超える場合は除外
            avg_diff = sum(diffs) / len(diffs)
            if avg_diff > MAX_AVG_DIFF:
                continue

            # 完全な店舗情報を返す
            shop_dict = dict(shop)
            shop_dict["score"] = round(avg_diff, 2)
            results.append(shop_dict)

        # スコアでソート（小さいほど良い）
        results.sort(key=lambda x: x["score"])
        
        return jsonify({
            "ok": True,
            "places": results
        })
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500
    finally:
        if db:
            db.close()