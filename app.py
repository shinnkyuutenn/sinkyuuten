from flask import Flask, render_template, redirect, session
import psycopg2.extras

from login import auth_bp
from get_db import get_db  

app = Flask(__name__)
app.secret_key = "your-secret-key"

# Blueprint の登録
app.register_blueprint(auth_bp)


@app.route("/", methods=["GET"])
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

    return render_template("index.html", users=users, username=session["user_name"])


@app.route("/back", methods=["POST"])
def back():
    return redirect("/login")


if __name__ == "__main__":
    app.run(debug=True)
