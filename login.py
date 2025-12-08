from flask import Blueprint, render_template, request, redirect, session
import psycopg2.extras
import base64
import hashlib

from db import get_connection   # ← あなたの db.py を使う

auth_bp = Blueprint("auth", __name__)


def check_password(password, stored_hash):
    """ハッシュ化されたパスワードを検証"""
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


@auth_bp.route("/login", methods=["GET"])
def login_form():
    return render_template("login.html")


@auth_bp.route("/login", methods=["POST"])
def login():
    email = request.form.get("email")
    password = request.form.get("password")

    db = get_connection()
    with db:
        cur = db.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cur.execute("SELECT * FROM users WHERE email = %s", (email,))
        user = cur.fetchone()

    if user is None:
        return "メールが間違っています"

    if not check_password(password, user["password_hash"]):
        return "パスワードが違います"

    # ログイン成功
    session["user_id"] = user["id"]
    session["user_name"] = user["name"]

    return redirect("/")


@auth_bp.route("/new_login", methods=["GET"])
def new_login_form():
    return render_template("new_login.html")


@auth_bp.route("/new_login", methods=["POST"])
def new_login():
    name = request.form.get("name")
    email = request.form.get("email")
    password = request.form.get("password")

    print(name, email, password)
    return redirect("/login")


