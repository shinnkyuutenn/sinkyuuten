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
    
    # 数値に変換
    try:
        spicy_level = int(spicy_level)
        clean_level = int(clean_level)
        comfortable_level = int(comfortable_level)
        congestion_level = int(congestion_level)
    except (ValueError, TypeError):
        return jsonify({"ok": False, "error": "評価項目は1-5の数値で入力してください"}), 400

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


# お気に入り機能
@auth_bp.route("/favorites_json", methods=["GET"])
def get_favorites_json():
    """ユーザーのお気に入り一覧を取得"""
    if "user_id" not in session:
        return jsonify({"ok": False, "error": "ログインが必要です"}), 401
    
    user_id = session["user_id"]
    db = get_connection()
    with db:
        cur = db.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cur.execute("""
            SELECT 
                s.id, s.name, s.shop_type, s.spicy_level, s.clean_level, 
                s.comfortable_level, s.congestion_level,
                (s.avg_rating)::float8 as avg_rating,
                s.photo_url, s.city_id,
                (s.latitude)::float8 as latitude,
                (s.longitude)::float8 as longitude,
                COALESCE(
                    json_agg(DISTINCT k.word) FILTER (WHERE k.word IS NOT NULL),
                    '[]'::json
                ) as keywords,
                uf.created_at as favorited_at
            FROM public.user_favorites uf
            JOIN public.shops s ON uf.shop_id = s.id
            LEFT JOIN public.shop_keywords sk ON s.id = sk.shop_id
            LEFT JOIN public.keywords k ON sk.keyword_id = k.id
            WHERE uf.user_id = %s
            GROUP BY s.id, s.name, s.shop_type, s.spicy_level, s.clean_level, 
                     s.comfortable_level, s.congestion_level, s.avg_rating, 
                     s.photo_url, s.city_id, s.latitude, s.longitude, uf.created_at
            ORDER BY uf.created_at DESC
        """, (user_id,))
        shops = cur.fetchall()
    
    return jsonify({
        "ok": True,
        "favorites": [dict(shop) for shop in shops]
    })


@auth_bp.route("/favorites_json", methods=["POST"])
def add_favorite_json():
    """お気に入りに追加"""
    if "user_id" not in session:
        return jsonify({"ok": False, "error": "ログインが必要です"}), 401
    
    user_id = session["user_id"]
    shop_id = request.json.get("shop_id")
    
    if not shop_id:
        return jsonify({"ok": False, "error": "shop_id が必要です"}), 400
    
    try:
        shop_id = int(shop_id)
    except (ValueError, TypeError):
        return jsonify({"ok": False, "error": "shop_id は数値である必要があります"}), 400
    
    db = get_connection()
    with db:
        cur = db.cursor()
        # 既に存在するかチェック
        cur.execute(
            "SELECT id FROM public.user_favorites WHERE user_id = %s AND shop_id = %s",
            (user_id, shop_id)
        )
        if cur.fetchone():
            return jsonify({"ok": False, "error": "既にお気に入りに追加されています"}), 409
        
        # 店舗が存在するかチェック
        cur.execute("SELECT id FROM public.shops WHERE id = %s", (shop_id,))
        if not cur.fetchone():
            return jsonify({"ok": False, "error": "店舗が見つかりません"}), 404
        
        # お気に入りに追加
        cur.execute(
            "INSERT INTO public.user_favorites (user_id, shop_id) VALUES (%s, %s)",
            (user_id, shop_id)
        )
        db.commit()
    
    return jsonify({
        "ok": True,
        "message": "お気に入りに追加しました"
    }), 201


@auth_bp.route("/favorites_json", methods=["DELETE"])
def remove_favorite_json():
    """お気に入りから削除"""
    if "user_id" not in session:
        return jsonify({"ok": False, "error": "ログインが必要です"}), 401
    
    user_id = session["user_id"]
    shop_id = request.json.get("shop_id")
    
    if not shop_id:
        return jsonify({"ok": False, "error": "shop_id が必要です"}), 400
    
    try:
        shop_id = int(shop_id)
    except (ValueError, TypeError):
        return jsonify({"ok": False, "error": "shop_id は数値である必要があります"}), 400
    
    db = get_connection()
    with db:
        cur = db.cursor()
        cur.execute(
            "DELETE FROM public.user_favorites WHERE user_id = %s AND shop_id = %s",
            (user_id, shop_id)
        )
        if cur.rowcount == 0:
            return jsonify({"ok": False, "error": "お気に入りが見つかりません"}), 404
        db.commit()
    
    return jsonify({
        "ok": True,
        "message": "お気に入りから削除しました"
    })


@auth_bp.route("/favorites_check_json", methods=["GET"])
def check_favorite_json():
    """お気に入り状態をチェック（複数のshop_idをチェック）"""
    if "user_id" not in session:
        return jsonify({"ok": True, "favorites": []}), 200
    
    user_id = session["user_id"]
    shop_ids = request.args.getlist("shop_id")
    
    if not shop_ids:
        return jsonify({"ok": True, "favorites": []}), 200
    
    try:
        shop_ids = [int(sid) for sid in shop_ids]
    except (ValueError, TypeError):
        return jsonify({"ok": False, "error": "shop_id は数値である必要があります"}), 400
    
    db = get_connection()
    with db:
        cur = db.cursor()
        cur.execute(
            "SELECT shop_id FROM public.user_favorites WHERE user_id = %s AND shop_id = ANY(%s)",
            (user_id, shop_ids)
        )
        favorite_ids = [row[0] for row in cur.fetchall()]
    
    return jsonify({
        "ok": True,
        "favorites": favorite_ids
    })
