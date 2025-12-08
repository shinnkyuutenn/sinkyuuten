from models import search_shops
from flask import Flask, render_template, redirect, session, request, psycopg2
import psycopg2.extras

from login import auth_bp
from get_db import get_db  


app = Flask(__name__)
app.secret_key = "your-secret-key"

# Blueprint の登録
app.register_blueprint(auth_bp)


@app.route("/", methods=["GET", "POST"])
def index():
  if "user_id" not in session:
        return redirect("/login")

    query_users = """
        SELECT id, email, spicy_level, clean_level, comfortable_level, congestion_level, name
        FROM users
        WHERE id = %s
    """

    db = get_db()
    with db:
        cur = db.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cur.execute(query_users, (session["user_id"],))
        users = cur.fetchall()
    db.close()

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

    return render_template("index.html", shops=shops, keyword=keyword, users=users, username=session["user_name"])


@app.route("/", methods=["GET"])
def index():
    

@app.route("/back", methods=["POST"])
def back():
    return redirect("/login")



if __name__ == "__main__":
    app.run(debug=True)
