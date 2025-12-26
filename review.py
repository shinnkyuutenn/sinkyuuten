from flask import Blueprint, request, jsonify, session
from db import get_connection
import psycopg2.extras

auth_review = Blueprint("auth_review", __name__)

def update_shop_ratings_from_reviews(db, shop_id):
    """店舗の評価をユーザーレビューの平均から計算して更新"""
    try:
        cur = db.cursor()
        update_query = """
            UPDATE public.shops s
            SET 
                spicy_level = CASE 
                    WHEN review_stats.avg_spicy IS NOT NULL 
                    THEN LEAST(5, GREATEST(1, ROUND(review_stats.avg_spicy)::integer))
                    ELSE NULL 
                END,
                clean_level = CASE 
                    WHEN review_stats.avg_clean IS NOT NULL 
                    THEN LEAST(5, GREATEST(1, ROUND(review_stats.avg_clean)::integer))
                    ELSE NULL 
                END,
                comfortable_level = CASE 
                    WHEN review_stats.avg_comfortable IS NOT NULL 
                    THEN LEAST(5, GREATEST(1, ROUND(review_stats.avg_comfortable)::integer))
                    ELSE NULL 
                END,
                congestion_level = CASE 
                    WHEN review_stats.avg_congestion IS NOT NULL 
                    THEN LEAST(5, GREATEST(1, ROUND(review_stats.avg_congestion)::integer))
                    ELSE NULL 
                END,
                avg_rating = review_stats.avg_avg_rating
            FROM (
                SELECT 
                    shop_id,
                    AVG(spicy_level)::numeric(3,2) as avg_spicy,
                    AVG(clean_level)::numeric(3,2) as avg_clean,
                    AVG(" comfortable_level")::numeric(3,2) as avg_comfortable,
                    AVG(" congestion_level")::numeric(3,2) as avg_congestion,
                    AVG(avg_rating)::numeric(3,2) as avg_avg_rating
                FROM public.users_review
                WHERE shop_id = %s
                GROUP BY shop_id
            ) review_stats
            WHERE s.id = review_stats.shop_id
        """
        cur.execute(update_query, (shop_id,))
        db.commit()
    except Exception as e:
        print(f"店舗評価の更新エラー: {e}")
        # 評価の更新に失敗してもレビュー投稿は成功とする
        db.rollback()

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
                    ur." comfortable_level" as comfortable_level,
                    ur." congestion_level" as congestion_level,
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
    print("レビュー")

    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"ok": False, "error": "ログインしてください"}), 401

    shop_id = request.form.get("shop_id")
    review = request.form.get("text")
    avg_rating = request.form.get("avg_rating")

    spicy = request.form.get("spicy")
    clean = request.form.get("clean")
    comfort = request.form.get("comfort")
    crowd = request.form.get("crowd")

    if not review:
        return jsonify({"ok": False, "error": "レビューが入力されていません"}), 400

    if not avg_rating:
        return jsonify({"ok": False, "error": "評価が記入されていません"}), 400

    if not all([spicy, clean, comfort, crowd]):
        return jsonify({"ok": False, "error": "項目が選択されていません"}), 400

    try:
        spicy = int(spicy)
        clean = int(clean)
        comfort = int(comfort)
        crowd = int(crowd)
        avg_rating = float(avg_rating)  # avg_ratingはNUMERIC型なのでfloatに変換
    except (ValueError, TypeError):
        return jsonify({"ok": False, "error": "数値が不正です"}), 400

    db = get_connection()
    try:
        cur = db.cursor()
        cur.execute(
            """
            INSERT INTO public.users_review
            (user_id, shop_id, user_review, avg_rating,
             spicy_level, clean_level, " comfortable_level", " congestion_level", review_time)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,CURRENT_TIMESTAMP)
            """,
            (user_id, shop_id, review, avg_rating,
             spicy, clean, comfort, crowd)
        )
        db.commit()
        
        # 店舗の評価をレビューの平均から更新
        update_shop_ratings_from_reviews(db, shop_id)
        
        response = jsonify({
            "ok": True,
            "message": "レビューを投稿することができました"
        })
        response.status_code = 201
        return response
    except Exception as e:
        import traceback
        error_msg = str(e)
        traceback.print_exc()
        print(f"レビュー投稿エラー: {error_msg}")
        db.rollback()
        return jsonify({"ok": False, "error": f"レビューの投稿に失敗しました: {error_msg}"}), 500
    finally:
        if db:
            db.close()
