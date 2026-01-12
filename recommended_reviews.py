from flask import Blueprint, jsonify, session, request
from db import get_connection
import psycopg2.extras

recommended_reviews_bp = Blueprint("recommended_reviews",__name__)

@recommended_reviews_bp.route("/recommended", methods=["GET", "OPTIONS"])
def recommended_reviews():
    # CORS 预检请求处理
    if request.method == 'OPTIONS':
        from flask import jsonify, request
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

        # 現在のユーザーの個人設定を確認（NULLでもOK）
        cur.execute("""
            SELECT spicy_level, clean_level, comfortable_level, congestion_level
            FROM public.users
            WHERE id = %s
        """, (user_id,))
        current_user = cur.fetchone()
        
        if not current_user:
            return jsonify([])

        # 現在のユーザーの設定値（NULLの場合は3をデフォルトとして使用）
        user_spicy = current_user["spicy_level"] if current_user["spicy_level"] else 3
        user_clean = current_user["clean_level"] if current_user["clean_level"] else 3
        user_comfort = current_user["comfortable_level"] if current_user["comfortable_level"] else 3
        user_congestion = current_user["congestion_level"] if current_user["congestion_level"] else 3

        # まず詳細マッチングを試す（すべての個人設定が設定されているレビュアー）
        sql_detailed = """
    SELECT
      ur.id AS review_id,
      ur.user_id,
      ur.user_review,
      ur.review_time,
      ur.shop_id,
      ur.avg_rating,
      COALESCE(u.name, '匿名ユーザー') AS reviewer_name,
      (
        COALESCE(ABS(COALESCE(u.spicy_level, %s) - %s), 0) +
        COALESCE(ABS(COALESCE(u.clean_level, %s) - %s), 0) +
        COALESCE(ABS(COALESCE(u.comfortable_level, %s) - %s), 0) +
        COALESCE(ABS(COALESCE(u.congestion_level, %s) - %s), 0)
      ) AS distance,
      (
        CASE WHEN u.spicy_level IS NOT NULL THEN 1 ELSE 0 END +
        CASE WHEN u.clean_level IS NOT NULL THEN 1 ELSE 0 END +
        CASE WHEN u.comfortable_level IS NOT NULL THEN 1 ELSE 0 END +
        CASE WHEN u.congestion_level IS NOT NULL THEN 1 ELSE 0 END
      ) AS matched_dimensions
    FROM public.users_review ur
    LEFT JOIN public.users u ON ur.user_id = u.id
    WHERE (ur.user_id IS NULL OR ur.user_id != %s)
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

        # 結果が3つ未満の場合は、すべてのレビューを取得（マッチング条件なし）
        if len(rows) < 3:
            sql_all = """
            SELECT
              ur.id AS review_id,
              ur.user_id,
              ur.user_review,
              ur.review_time,
              ur.shop_id,
              ur.avg_rating,
              COALESCE(u.name, '匿名ユーザー') AS reviewer_name,
              0 AS distance,
              0 AS matched_dimensions
            FROM public.users_review ur
            LEFT JOIN public.users u ON ur.user_id = u.id
            WHERE (ur.user_id IS NULL OR ur.user_id != %s)
            ORDER BY ur.review_time DESC
            LIMIT 20;
            """
            
            cur.execute(sql_all, (user_id,))
            rows_all = cur.fetchall()
            
            # 既存の結果と結合（重複を避ける）
            existing_ids = {row["review_id"] for row in rows}
            for row in rows_all:
                if row["review_id"] not in existing_ids:
                    rows.append(row)
                    if len(rows) >= 20:
                        break

        # 最低3つを確保
        if len(rows) < 3:
            # さらに緩い条件で取得（自分のレビューも含めるが、最後に除外）
            sql_minimum = """
            SELECT
              ur.id AS review_id,
              ur.user_id,
              ur.user_review,
              ur.review_time,
              ur.shop_id,
              ur.avg_rating,
              COALESCE(u.name, '匿名ユーザー') AS reviewer_name,
              0 AS distance,
              0 AS matched_dimensions
            FROM public.users_review ur
            LEFT JOIN public.users u ON ur.user_id = u.id
            ORDER BY ur.review_time DESC
            LIMIT 20;
            """
            
            cur.execute(sql_minimum)
            rows_minimum = cur.fetchall()
            
            existing_ids = {row["review_id"] for row in rows}
            for row in rows_minimum:
                if row["review_id"] not in existing_ids and row["user_id"] != user_id:
                    rows.append(row)
                    if len(rows) >= 3:
                        break

        MAX_DISTANCE = 16  # 4×(5-1) - すべての次元が設定されている場合の最大距離

        results = []
        for row in rows[:20]:  # 最大20件
            matched_dimensions = row.get("matched_dimensions", 0)
            distance = row.get("distance", 0)
            
            # マッチした次元数に応じて最大距離を調整
            if matched_dimensions > 0:
                max_distance_for_match = MAX_DISTANCE * (matched_dimensions / 4.0)
                if max_distance_for_match > 0:
                    match_percent = max(0, round(100 - (distance / max_distance_for_match * 100)))
                else:
                    match_percent = 50  # デフォルトマッチ度
            else:
                match_percent = 50  # マッチング情報がない場合は50%をデフォルト

            results.append({
                "review_id": row["review_id"],
                "shop_id": row["shop_id"],
                "reviewer_id": row["user_id"],
                "reviewer_name": row["reviewer_name"],
                "review": row["user_review"],
                "review_time": row["review_time"].isoformat(),
                "avg_rating": float(row["avg_rating"]) if row["avg_rating"] else None,
                "match_percent": match_percent 
            })

    finally:
        if conn:
            conn.close()

    return jsonify(results)
