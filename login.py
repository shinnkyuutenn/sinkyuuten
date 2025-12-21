from flask import Blueprint, request, session, jsonify
from flask_cors import CORS
import psycopg2.extras
import base64
import hashlib
import secrets

from db import get_connection

auth_bp = Blueprint("auth", __name__)
CORS(auth_bp, supports_credentials=True)


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



@auth_bp.route("/login_json", methods=["POST"])
def login_json():
    print("🔥 POST /login_json")

    email = request.form.get("email")
    password = request.form.get("password")

    if not email or not password:
        return jsonify({
            "ok": False,
            "error": "email または password が未入力です"
        }), 400

    db = get_connection()
    with db:
        cur = db.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cur.execute(
            "SELECT * FROM users WHERE email = %s",
            (email,)
        )
        user = cur.fetchone()

    if user is None:
        return jsonify({
            "ok": False,
            "error": "メールアドレスが違います"
        }), 401

    if not check_password(password, user["password_hash"]):
        return jsonify({
            "ok": False,
            "error": "パスワードが違います"
        }), 401

    # ログイン成功
    session["user_id"] = user["id"]
    session["user_name"] = user["name"]

    return jsonify({
        "ok": True,
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"]
        }
    })


@auth_bp.route("/register_json", methods=["POST"])
def register_json():
    print("🔥 POST /register_json")

    name = request.form.get("name")
    email = request.form.get("email")
    password = request.form.get("password")

    spicy_level = request.form.get("spicy_level")
    clean_level = request.form.get("clean_level")
    comfortable_level = request.form.get("comfortable_level")
    congestion_level = request.form.get("congestion_level")

    # ---- バリデーション ----
    if not name or len(name) < 3:
        return jsonify({"ok": False, "error": "名前が短すぎます"}), 400

    if not email or "@" not in email:
        return jsonify({"ok": False, "error": "メール形式が不正です"}), 400

    if not password:
        return jsonify({"ok": False, "error": "パスワード未入力"}), 400

    if not all([spicy_level, clean_level, comfortable_level, congestion_level]):
        return jsonify({"ok": False, "error": "評価項目が未入力です"}), 400

    db = get_connection()
    with db:
        cur = db.cursor()

        # メール重複チェック
        cur.execute(
            "SELECT id FROM users WHERE email = %s",
            (email,)
        )
        if cur.fetchone():
            return jsonify({
                "ok": False,
                "error": "すでに登録されています"
            }), 409

        password_hash = hash_password(password)

        cur.execute(
            """
            INSERT INTO users
            (name, email, password_hash,
             spicy_level, clean_level, comfortable_level, congestion_level)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            """,
            (
                name, email, password_hash,
                spicy_level, clean_level, comfortable_level, congestion_level
            )
        )
        db.commit()

    return jsonify({
        "ok": True,
        "message": "ユーザー登録が完了しました"
    }), 201



@auth_bp.route("/me_json", methods=["GET"])
def me_json():
    if "user_id" not in session:
        return jsonify({
            "ok": False,
            "logged_in": False
        }), 401

    return jsonify({
        "ok": True,
        "logged_in": True,
        "user": {
            "id": session["user_id"],
            "name": session["user_name"]
        }
    })



@auth_bp.route("/logout_json", methods=["POST"])
def logout_json():
    session.clear()
    return jsonify({
        "ok": True,
        "message": "ログアウトしました"
    })
