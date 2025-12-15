from flask import Flask, request, jsonify
from flask_cors import CORS
import psycopg2.extras

from db import get_connection
from models import search_shops

app = Flask(__name__)
CORS(app)
app.secret_key = "your-secret-key"


def to_int_or_none(value):
    try:
        return int(value) if value not in (None, "") else None
    except ValueError:
        return None


@app.route("/search_shops_json", methods=["GET"])
def search_shops_json():
    print("🔥 検索APIが呼ばれました")
    print("args:", request.args)
    keyword = request.args.get("keyword", '')
    shop_type = request.args.get("shop_type", '')
    city = request.args.get("city", '')

    min_spicy = to_int_or_none(request.args.get("min_spicy", 0))
    min_clean = to_int_or_none(request.args.get("min_clean", 0))
    min_comfort = to_int_or_none(request.args.get("min_comfort", 0))
    min_congestion = to_int_or_none(request.args.get("min_congestion", 0))

    shops = search_shops(
        keyword=keyword,
        shop_type=shop_type,
        city=city,
        min_spicy=min_spicy,
        min_clean=min_clean,
        min_comfort=min_comfort,
        min_congestion=min_congestion,
    )

    return jsonify(shops)


@app.route("/")
def health():
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    app.run(debug=True)
