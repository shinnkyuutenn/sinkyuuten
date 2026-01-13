from flask import Blueprint, request, jsonify, session
from db import get_connection

import psycopg2.extras

auth_review = Blueprint("auth_review", __name__)

@auth_review.route("/review_json", methods=["GET"])
def get_reviews_json():
    """店舗のレビュー一覧を取得"""
    shop_id = request.args.get("shop_id")
    
    if not shop_id:
        return jsonify({"ok": False, "error": "shop_id が必要です"}), 400
    
    try:
        shop_id = int(shop_id)
    except (ValueError, TypeError):
        return jsonify({"ok": False, "error": "shop_id は数値である必要があります"}), 400
    
    db = get_connection()
    try:
        with db:
            cur = db.cursor(cursor_factory=psycopg2.extras.DictCursor)
            cur.execute("""
                SELECT 
                    ur.id,
                    ur.user_id,
                    ur.user_review,
                    ur.review_time,
                    ur.spicy_level,
                    ur.clean_level,
                    ur.comfortable_level as comfortable_level,
                    ur.congestion_level as congestion_level,
                    ur.avg_rating,
                    u.name as user_name,
                    u.avatar as user_avatar
                FROM public.users_review ur
                JOIN public.users u ON ur.user_id = u.id
                WHERE ur.shop_id = %s
                ORDER BY ur.review_time DESC
            """, (shop_id,))
            reviews = cur.fetchall()
        
        return jsonify({
            "ok": True,
            "reviews": [dict(review) for review in reviews]
        })
    except Exception as e:
        print(f"レビュー取得エラー: {e}")
        return jsonify({"ok": False, "error": "レビューの取得に失敗しました"}), 500
    finally:
        db.close()


@auth_review.route("/review_json", methods=["POST"])
def review_json():
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"ok": False, "error": "login required"}), 401

    shop_id = request.form.get("shop_id")
    review = request.form.get("text")
    avg_rating = request.form.get("avg_rating")

    spicy_level = request.form.get("spicy")
    clean_level = request.form.get("clean")
    comfortable_level = request.form.get("comfort")
    congestion_level = request.form.get("crowd")
    
    # 空字符串を None に変換（非餐厅の場合、spicy_level は空文字列で送信される）
    # 非空の場合は整数に変換
    spicy_level = None if (spicy_level == '' or spicy_level is None) else int(spicy_level)
    clean_level = None if (clean_level == '' or clean_level is None) else int(clean_level)
    comfortable_level = None if (comfortable_level == '' or comfortable_level is None) else int(comfortable_level)
    congestion_level = None if (congestion_level == '' or congestion_level is None) else int(congestion_level)
    avg_rating = None if (avg_rating == '' or avg_rating is None) else float(avg_rating)

    if not shop_id or not review:
        return jsonify({"ok": False, "error": "missing"}), 400

    db = get_connection()
    try:
        with db:
            with db.cursor() as cur:
                # 插入或更新评论
                cur.execute("""
                    INSERT INTO users_review
                    (user_id, shop_id, user_review, spicy_level, clean_level, comfortable_level, congestion_level, avg_rating, review_time)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP)
                    ON CONFLICT (user_id, shop_id)
                    DO UPDATE SET
                            user_review = EXCLUDED.user_review,
                            spicy_level = EXCLUDED.spicy_level,
                            clean_level = EXCLUDED.clean_level,
                            comfortable_level = EXCLUDED.comfortable_level,
                            congestion_level = EXCLUDED.congestion_level,
                            avg_rating = EXCLUDED.avg_rating,
                            review_time = CURRENT_TIMESTAMP
                """, (user_id, shop_id, review, spicy_level, clean_level, comfortable_level, congestion_level, avg_rating,))

                # 更新店铺的平均评分和各项指标
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
                """, (shop_id,))

        return jsonify({"ok": True}), 201
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500
    finally:
        db.close()