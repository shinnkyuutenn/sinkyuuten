from flask import Flask, render_template, request, redirect, session
import psycopg2
import psycopg2.extras
import base64
import hashlib

app = Flask(__name__)
app.secret_key = "your-secret-key"  

def get_db():
    con = psycopg2.connect(
        host="localhost",
        database="twiview_db",
        user="postgres",
        password="kouga657325",
        port=5432
    )
    return con


def check_password(password, stored_hash):
    """
    stored_hash の形式:
    pbkdf2_sha256$iterations$salt$base64hash
    """
    algo, iterations, salt, hashed = stored_hash.split('$')
    iterations = int(iterations)

    pw_hash = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        iterations
    )
    b64_hash = base64.b64encode(pw_hash).decode("ascii").strip()

    return b64_hash == hashed


@app.route("/login", methods=['GET'])
def login_form():
    return render_template("login.html")


@app.route("/login", methods=['POST'])
def login():
    email = request.form.get("email")
    password = request.form.get("password")

    db = get_db()
    with db:
        cur = db.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cur.execute("SELECT * FROM users WHERE email = %s", (email,))
        user = cur.fetchone()
    db.close()

    if user is None:
        return "メールが間違っています"

    if not check_password(password, user["password_hash"]):
        return "パスワードが違います"

    # ログイン成功 → セッションに保存
    session["user_id"] = user["id"]
    session["user_name"] = user["name"]

    return redirect("/")


@app.route("/new_login",methods=["GET"])
def new_login_form():
      return render_template("new_login.html")

@app.route("/new_login",methods=["POST"])
def new_login():
     name = request.form.get("name")
     email = request.form.get=("email")
     password = request.form.get("password")

     print(name)
     print(email)
     print(password)
     return redierct("/login.html")

@app.route("/", methods=['GET'])
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


if __name__ == "__main__":
    app.run(debug=True)


@app.route("/back",methods=["POST"])
def back():
      return redirect("/login")