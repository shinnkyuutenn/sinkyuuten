from flask import Blueprint, render_template, request, redirect, session
import psycopg2.extras
import base64
import hashlib
import secrets

from db import get_connection   

auth_bp = Blueprint("auth", __name__)



def hash_password(password, salt=None, iterations=310000):
    if salt is None:
        salt = secrets.token_hex(16)

    pw_hash = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        iterations
    )

    b64_hash = base64.b64encode(pw_hash).decode("ascii").strip()
    return f"pbkdf2_sha256${iterations}${salt}${b64_hash}"



def check_password(password, stored_hash):
    algo, iterations, salt, hashed = stored_hash.split('$')
    algo, iterations, salt, hashed = stored_hash.split("$")
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

    session["user_id"] = user["id"]
    session["user_name"] = user["name"]

    return redirect("/")


@auth_bp.route("/new_login", methods=["GET"])
def new_login_form():
    return render_template("new_login.html")


@auth_bp.route("/new_login", methods=["POST"])
def new_login():
    name = request.form.get("name")
    if not name or len(name) < 3:
        return render_template(
            "new_login.html", error_user=True, form=request.form
        )

    email = request.form.get("email")
    if not email or "@" not in email or ".com" not in email:
        return render_template(
            "new_login.html", error_email=True, form=request.form
        )

    password = request.form.get("password")
    if not password:
        return render_template(
            "new_login.html", error_password=True, form=request.form
        )

    spicy_level = request.form.get("spicy_level")
    if not spicy_level:
      return render_template(
            "new_login.html", error_spicy=True, form=request.form
      )
    
    clean_level = request.form.get("clean_level")
    if not clean_level:
      return render_template(
            "new_login.html", error_clean=True, form=request.form
      )
    
    comfortable_level = request.form.get("comfortable_level")
    if not comfortable_level:
      return comfortable_level(
            "new_login.html", error_comfortable=True, form=request.form
      )
    
    congestion_level = request.form.get("congestion_level")
    if not congestion_level:
      return congestion_level(
            "new_login.html", error_congestion=True, form=request.form
      )

    db = get_connection()
    with db:
        cur = db.cursor()


        cur.execute("SELECT id FROM users WHERE email = %s", (email,))
        if cur.fetchone():
            return render_template(
                "new_login.html", error_unique=True, form=request.form
            )

        
        password_hash = hash_password(password)

        cur.execute(
            """
            INSERT INTO users (name, email, password_hash, spicy_level, clean_level, comfortable_level, congestion_level)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            """,
            (name, email, password_hash, spicy_level, clean_level, comfortable_level, congestion_level),
        )
        db.commit()

    return redirect("/")

