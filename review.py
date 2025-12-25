from flask import Blueprint, request, jsonify, session
from db import get_connection

auth_review = Blueprint("auth_review", __name__)

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
        avg_rating = int(avg_rating)
    except (ValueError, TypeError):
        return jsonify({"ok": False, "error": "数値が不正です"}), 400

    db = get_connection()
    with db:
        cur = db.cursor()
        cur.execute(
            """
            INSERT INTO users_review
            (user_id, shop_id, user_review, avg_rating,
             spicy_level, clean_level, comfortable_level, congestion_level)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
            """,
            (user_id, shop_id, review, avg_rating,
             spicy, clean, comfort, crowd)
        )
        db.commit()

    return jsonify({
        "ok": True,
        "message": "レビューを投稿することができました"
    }), 201
