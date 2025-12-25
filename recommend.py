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
    with db:
        cur = db.cursor(cursor_factory=psycopg2.extras.DictCursor)

        cur.execute("""
            SELECT spicy_level, clean_level, comfortable_level, congestion_level
            FROM users
            WHERE id = %s
        """, (session["user_id"],))
        user = cur.fetchone()

        if not user:
            return jsonify({"ok": False, "error": "ユーザーが見つかりません"}), 404

        cur.execute("SELECT * FROM shops")
        shops = cur.fetchall()

    results = []

    for shop in shops:
        diffs = []

        if shop["shop_type"] == "restaurant":
            diffs.append(abs((user["spicy_level"] or 3) - (shop["spicy_level"] or 3)))

        diffs.append(abs(user["clean_level"] - shop["clean_level"]))
        diffs.append(abs(user["comfortable_level"] - shop["comfortable_level"]))
        diffs.append(abs(user["congestion_level"] - shop["congestion_level"]))

        if max(diffs) > MAX_DIFF_PER_AXIS:
            continue

        avg_diff = sum(diffs) / len(diffs)
        if avg_diff > MAX_AVG_DIFF:
            continue

        results.append({
            "id": shop["id"],
            "name": shop["name"],
            "type": shop["shop_type"],
            "score": round(avg_diff, 2),
            "diff": {
                "spicy_level": diffs[0] if shop["shop_type"] == "restaurant" else None,
                "clean_level": diffs[-3],
                "comfortable_level": diffs[-2],
                "congestion_level": diffs[-1]
            }
        })

    results.sort(key=lambda x: x["score"])
    
    return jsonify({
        "ok": True,
        "places": results
    })