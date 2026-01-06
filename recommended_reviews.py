from flask import Blueprint, jsonify, session
from db import get_connection
import psycopg2.extras

recommended_reviews_bp = Blueprint("recommended_reviews",__name__)

@recommended_reviews_bp.route("/recommended", methods=["GET"])
def recommended_reviews():
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "unauthorized"}), 401

    conn = get_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)

    sql = """
    SELECT
      ur.id AS review_id,
      ur.user_id,
      ur.user_review,
      ur.review_time,
      ur.shop_id,
      ur.avg_rating,
      u.name AS reviewer_name,
      (
        ABS(u.spicy_level - me.spicy_level) +
        ABS(u.clean_level - me.clean_level) +
        ABS(u.comfortable_level - me.comfortable_level) +
        ABS(u.congestion_level - me.congestion_level)
      ) AS distance
    FROM users_review ur
    JOIN users u ON ur.user_id = u.id
    JOIN users me ON me.id = %s
    WHERE u.id != me.id
    ORDER BY distance ASC, ur.review_time DESC
    LIMIT 20;
    """

    cur.execute(sql, (user_id,))
    rows = cur.fetchall()

    MAX_DISTANCE = 16  #4×(5-1)

    results = []
    for row in rows:
        match_percent = max(
            0,
            round(100 - (row["distance"] / MAX_DISTANCE * 100))
        )

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

    cur.close()
    conn.close()

    return jsonify(results)
