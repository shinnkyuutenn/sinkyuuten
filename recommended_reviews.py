from flask import Blueprint, jsonify, session, request
from db import get_connection
import psycopg2.extras

recommended_reviews_bp = Blueprint("recommended_reviews", __name__)

@recommended_reviews_bp.route("/recommended", methods=["GET", "OPTIONS"])
def recommended_reviews():
    if request.method == 'OPTIONS':
        response = jsonify({})
        response.headers.add('Access-Control-Allow-Origin', request.headers.get('Origin', '*'))
        response.headers.add('Access-Control-Allow-Methods', 'GET, OPTIONS')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response

    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "unauthorized"}), 401

    conn = get_connection()
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)

        #ユーザー設定取得
        cur.execute("""
            SELECT spicy_level, clean_level, comfortable_level, congestion_level
            FROM public.users
            WHERE id = %s
        """, (user_id,))
        current_user = cur.fetchone()

        if not current_user:
            return jsonify([])

        user_spicy = current_user["spicy_level"] or 3
        user_clean = current_user["clean_level"] or 3
        user_comfort = current_user["comfortable_level"] or 3
        user_congestion = current_user["congestion_level"] or 3

        MAX_DISTANCE = 16   #4項目×(5-1)
        MAX_DIFF = 2        #各項目のの許容差
        results = []

        #メインの詳細マッチング
        sql_detailed = """
            SELECT
              ur.id AS review_id,
              ur.user_id,
              ur.user_review,
              ur.review_time,
              ur.shop_id,
              ur.avg_rating,
              COALESCE(u.name, '匿名ユーザー') AS reviewer_name,
              u.spicy_level,
              u.clean_level,
              u.comfortable_level,
              u.congestion_level,
              (
                ABS(COALESCE(u.spicy_level, %s) - %s) +
                ABS(COALESCE(u.clean_level, %s) - %s) +
                ABS(COALESCE(u.comfortable_level, %s) - %s) +
                ABS(COALESCE(u.congestion_level, %s) - %s)
              ) AS distance,
              (
                CASE WHEN u.spicy_level IS NOT NULL THEN 1 ELSE 0 END +
                CASE WHEN u.clean_level IS NOT NULL THEN 1 ELSE 0 END +
                CASE WHEN u.comfortable_level IS NOT NULL THEN 1 ELSE 0 END +
                CASE WHEN u.congestion_level IS NOT NULL THEN 1 ELSE 0 END
              ) AS matched_dimensions
            FROM public.users_review ur
            LEFT JOIN public.users u ON ur.user_id = u.id
            WHERE ur.user_id != %s
            ORDER BY matched_dimensions DESC, distance ASC, ur.review_time DESC
            LIMIT 20;
        """

        cur.execute(sql_detailed, (
            user_spicy, user_spicy,
            user_clean, user_clean,
            user_comfort, user_comfort,
            user_congestion, user_congestion,
            user_id
        ))
        rows = cur.fetchall()

        #マッチ率の計算
        def calculate_match(row, weaken=False):
            distance = row["distance"]
            matched_dimensions = row["matched_dimensions"]

            diffs = [
                abs((row["spicy_level"] or 3) - user_spicy),
                abs((row["clean_level"] or 3) - user_clean),
                abs((row["comfortable_level"] or 3) - user_comfort),
                abs((row["congestion_level"] or 3) - user_congestion),
            ]

            for diff in diffs:
                if diff > MAX_DIFF:
                    distance += (diff - MAX_DIFF) * 2

            if matched_dimensions > 0:
                max_dist = MAX_DISTANCE * (matched_dimensions / 4)
                match = max(0, 100 - (distance / max_dist * 100))
            else:
                match = 50

            #補完レビューは弱める
            if weaken:
                match *= 0.6

            return round(match)

        #詳細マッチング結果
        for row in rows:
            results.append({
                "review_id": row["review_id"],
                "shop_id": row["shop_id"],
                "reviewer_id": row["user_id"],
                "reviewer_name": row["reviewer_name"],
                "review": row["user_review"],
                "review_time": row["review_time"].isoformat() if row["review_time"] else None,
                "avg_rating": float(row["avg_rating"]) if row["avg_rating"] else None,
                "match_percent": calculate_match(row),
                "is_fallback": False
            })

        #補完　最新レビュー+軽いマッチ(ユーザーが少ない時対策)
        if len(results) < 3:
            sql_fallback = """
                SELECT
                  ur.id AS review_id,
                  ur.user_id,
                  ur.user_review,
                  ur.review_time,
                  ur.shop_id,
                  ur.avg_rating,
                  COALESCE(u.name, '匿名ユーザー') AS reviewer_name,
                  u.spicy_level,
                  u.clean_level,
                  u.comfortable_level,
                  u.congestion_level,
                  (
                    ABS(COALESCE(u.spicy_level, %s) - %s) +
                    ABS(COALESCE(u.clean_level, %s) - %s) +
                    ABS(COALESCE(u.comfortable_level, %s) - %s) +
                    ABS(COALESCE(u.congestion_level, %s) - %s)
                  ) AS distance,
                  (
                    CASE WHEN u.spicy_level IS NOT NULL THEN 1 ELSE 0 END +
                    CASE WHEN u.clean_level IS NOT NULL THEN 1 ELSE 0 END +
                    CASE WHEN u.comfortable_level IS NOT NULL THEN 1 ELSE 0 END +
                    CASE WHEN u.congestion_level IS NOT NULL THEN 1 ELSE 0 END
                  ) AS matched_dimensions
                FROM public.users_review ur
                LEFT JOIN public.users u ON ur.user_id = u.id
                WHERE ur.user_id != %s
                ORDER BY ur.review_time DESC
                LIMIT 20;
            """

            cur.execute(sql_fallback, (
                user_spicy, user_spicy,
                user_clean, user_clean,
                user_comfort, user_comfort,
                user_congestion, user_congestion,
                user_id
            ))
            fallback_rows = cur.fetchall()

            existing_ids = {r["review_id"] for r in results}

            for row in fallback_rows:
                if row["review_id"] in existing_ids:
                    continue

                results.append({
                    "review_id": row["review_id"],
                    "shop_id": row["shop_id"],
                    "reviewer_id": row["user_id"],
                    "reviewer_name": row["reviewer_name"],
                    "review": row["user_review"],
                    "review_time": row["review_time"].isoformat() if row["review_time"] else None,
                    "avg_rating": float(row["avg_rating"]) if row["avg_rating"] else None,
                    "match_percent": calculate_match(row, weaken=True),
                    "is_fallback": True
                })

                if len(results) >= 3:
                    break

        return jsonify(results[:3])

    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500
    finally:
        if conn:
            conn.close()


