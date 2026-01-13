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
                # 处理非餐厅类型店铺的spicy_level（可能为None或空字符串）
                spicy_level = data.get("spicy_level")
                if spicy_level == '' or spicy_level is None:
                    spicy_level = None
                
                clean_level = data.get("clean_level")
                if clean_level == '' or clean_level is None:
                    clean_level = None
                
                comfortable_level = data.get("comfortable_level")
                if comfortable_level == '' or comfortable_level is None:
                    comfortable_level = None
                
                congestion_level = data.get("congestion_level")
                if congestion_level == '' or congestion_level is None:
                    congestion_level = None
                
                avg_rating = data.get("avg_rating")
                if avg_rating == '' or avg_rating is None:
                    avg_rating = None

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
                    spicy_level,
                    clean_level,
                    comfortable_level,
                    congestion_level,
                    avg_rating
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

