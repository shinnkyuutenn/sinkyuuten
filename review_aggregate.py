from flask import Blueprint, request, jsonify, session
import psycopg2
import os
from db import get_connection

review_aggregate_bp = Blueprint("review_aggregate", __name__)

@review_aggregate_bp.route("/reviews", methods=["POST"])
def aggregate_review():

    if "user_id" not in session:
        return jsonify({"ok": False, "error": "ログインが必要です"}), 401

    data = request.json
    user_id = session["user_id"]

    conn = get_connection()

    try:
        with conn:
            with conn.cursor() as cur:

                cur.execute("""
                    INSERT INTO users_review (
                        user_id, shop_id, user_review, review_time,
                        spicy_level, clean_level, comfortable_level,
                        congestion_level, avg_rating
                    ) VALUES (
                        %s, %s, %s, NOW(),
                        %s, %s, %s, %s, %s
                    )
                """, (
                    user_id,
                    data["shop_id"],
                    data["user_review"],
                    data["spicy_level"],
                    data["clean_level"],
                    data["comfortable_level"],
                    data["congestion_level"],
                    data["avg_rating"]
                ))

                cur.execute("""
                    UPDATE shops
                    SET
                      spicy_level = sub.spicy_level,
                      clean_level = sub.clean_level,
                      comfortable_level = sub.comfortable_level,
                      congestion_level = sub.congestion_level,
                      avg_rating = sub.avg_rating,
                      updated_at = NOW()
                    FROM (
                      SELECT
                        shop_id,
                        CASE 
                          WHEN COUNT(spicy_level) > 0 THEN ROUND(AVG(spicy_level))
                          ELSE NULL
                        END AS spicy_level,
                        CASE 
                          WHEN COUNT(clean_level) > 0 THEN ROUND(AVG(clean_level))
                          ELSE NULL
                        END AS clean_level,
                        CASE 
                          WHEN COUNT(comfortable_level) > 0 THEN ROUND(AVG(comfortable_level))
                          ELSE NULL
                        END AS comfortable_level,
                        CASE 
                          WHEN COUNT(congestion_level) > 0 THEN ROUND(AVG(congestion_level))
                          ELSE NULL
                        END AS congestion_level,
                        CASE 
                          WHEN COUNT(avg_rating) > 0 THEN ROUND(AVG(avg_rating), 1)
                          ELSE NULL
                        END AS avg_rating
                      FROM users_review
                      WHERE shop_id = %s
                      GROUP BY shop_id
                    ) sub
                    WHERE shops.id = sub.shop_id;
                """, (data["shop_id"],))

        return jsonify({
            "ok": True,
            "message": "review created"
        }), 201

    except Exception as e:
        return jsonify({
            "ok": False,
            "error": str(e)
        }), 500

    finally:
        conn.close()

