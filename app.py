from flask import Flask, render_template, request, psycopg2
from models import search_shops

app = Flask(__name__)

@app.route("/", methods=["GET", "POST"])
def index():
    shops = []
    keyword = None
    if request.method == "POST":
        keyword = request.form.get("keyword")  
        shop_type = request.form.get("shop_type")
        min_spicy = request.form.get("min_spicy")
        min_clean = request.form.get("min_clean")
        min_comfort = request.form.get("min_comfort")
        min_congestion = request.form.get("min_congestion")

        shops = search_shops(
            shop_type=shop_type,
            min_spicy=int(min_spicy) if min_spicy else None,
            min_clean=int(min_clean) if min_clean else None,
            min_comfort=int(min_comfort) if min_comfort else None,
            min_congestion=int(min_congestion) if min_congestion else None,
            keyword=keyword
        )

    return render_template("index.html", shops=shops, keyword=keyword)

if __name__ == "__main__":
    app.run(debug=True)
