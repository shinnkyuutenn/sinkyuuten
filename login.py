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
    if not stored_hash:
        return False
    try:
        parts = stored_hash.split("$")
        if len(parts) != 4:
            return False
        algo, iterations, salt, hashed = parts
        iterations = int(iterations)

        pw_hash = hashlib.pbkdf2_hmac(
            "sha256",
            password.encode("utf-8"),
            salt.encode("utf-8"),
            iterations
        )

        b64_hash = base64.b64encode(pw_hash).decode("ascii").strip()
        return b64_hash == hashed
    except (ValueError, AttributeError, IndexError) as e:
        print(f"パスワード検証エラー: {e}, stored_hash: {stored_hash}")
        return False



@auth_bp.route("/login_json", methods=["POST"])
def login_json():
    """ログインAPI"""
    db = None
    try:
        email = request.form.get("email")
        password = request.form.get("password")

        print(f"ログイン試行: email={email}")

        if not email or not password:
            return jsonify({
                "ok": False,
                "error": "email または password が未入力です"
            }), 400

        print("データベース接続を試みます...")
        db = get_connection()
        if not db:
            print("データベース接続失敗")
            return jsonify({
                "ok": False,
                "error": "データベース接続に失敗しました"
            }), 500

        print("データベース接続成功、ユーザー検索中...")
        cur = db.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cur.execute(
            "SELECT id, name, email, password_hash, avatar, spicy_level, clean_level, comfortable_level, congestion_level FROM users WHERE email = %s",
            (email,)
        )
        user = cur.fetchone()

        if user is None:
            print(f"ユーザーが見つかりません: {email}")
            if db:
                try:
                    db.close()
                except:
                    pass
            return jsonify({
                "ok": False,
                "error": "メールアドレスが違います"
            }), 401

        print(f"ユーザーが見つかりました: id={user.get('id')}, name={user.get('name')}")
        password_hash = user.get("password_hash") if user else None
        if not password_hash:
            print("パスワードハッシュが見つかりません")
            if db:
                try:
                    db.close()
                except:
                    pass
            return jsonify({
                "ok": False,
                "error": "パスワードハッシュが見つかりません"
            }), 500

        print("パスワード検証中...")
        if not check_password(password, password_hash):
            print("パスワードが一致しません")
            if db:
                try:
                    db.close()
                except:
                    pass
            return jsonify({
                "ok": False,
                "error": "パスワードが違います"
            }), 401

        print("パスワード検証成功、セッション設定中...")
        # ログイン成功
        try:
            session.permanent = True  # セッションを永続化
            session["user_id"] = user["id"]
            session["user_name"] = user["name"]
            print(f"セッション設定成功: user_id={user['id']}, session_id={session.get('_id', 'N/A')}")
        except Exception as session_error:
            print(f"セッション設定エラー: {session_error}")
            import traceback
            traceback.print_exc()
            # セッション設定に失敗した場合はエラーを返す
            if db:
                try:
                    db.close()
                except:
                    pass
            return jsonify({
                "ok": False,
                "error": f"セッション設定に失敗しました: {str(session_error)}"
            }), 500

        result = jsonify({
            "ok": True,
            "user": {
                "id": user["id"],
                "name": user["name"],
                "email": user["email"],
                "avatar": user.get("avatar"),
                "spicy_level": user.get("spicy_level"),
                "clean_level": user.get("clean_level"),
                "comfortable_level": user.get("comfortable_level"),
                "congestion_level": user.get("congestion_level")
            }
        })
        
        if db:
            try:
                db.close()
            except:
                pass
        
        print("ログイン成功")
        return result
    except Exception as e:
        print(f"ログインエラー: {e}")
        import traceback
        error_trace = traceback.format_exc()
        print(error_trace)
        return jsonify({
            "ok": False,
            "error": f"ログイン処理中にエラーが発生しました: {str(e)}",
            "type": type(e).__name__
        }), 500
    finally:
        if db:
            try:
                db.close()
            except:
                pass


@auth_bp.route("/register_json", methods=["POST"])
def register_json():
    """ユーザー登録API"""
    db = None
    try:
        name = request.form.get("name")
        email = request.form.get("email")
        password = request.form.get("password")

        spicy_level = request.form.get("spicy_level")
        clean_level = request.form.get("clean_level")
        comfortable_level = request.form.get("comfortable_level")
        congestion_level = request.form.get("congestion_level")

        print(f"新規登録試行: email={email}, name={name}")

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

        print("データベース接続を試みます...")
        db = get_connection()
        if not db:
            print("データベース接続失敗")
            return jsonify({
                "ok": False,
                "error": "データベース接続に失敗しました"
            }), 500

        print("データベース接続成功、ユーザー登録処理を開始...")
        cur = db.cursor()

        # メール重複チェック
        cur.execute(
            "SELECT id FROM users WHERE email = %s",
            (email,)
        )
        if cur.fetchone():
            print(f"メールアドレスが既に登録されています: {email}")
            if db:
                try:
                    db.close()
                except:
                    pass
            return jsonify({
                "ok": False,
                "error": "すでに登録されています"
            }), 409

        print("パスワードハッシュを生成中...")
        password_hash = hash_password(password)

        print("ユーザー情報をデータベースに挿入中...")
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
        print("ユーザー登録が完了しました")

        result = jsonify({
            "ok": True,
            "message": "ユーザー登録が完了しました"
        })
        
        if db:
            try:
                db.close()
            except:
                pass
        
        return result, 201
    except Exception as e:
        print(f"新規登録エラー: {e}")
        import traceback
        error_trace = traceback.format_exc()
        print(error_trace)
        if db:
            try:
                db.close()
            except:
                pass
        return jsonify({
            "ok": False,
            "error": f"ユーザー登録処理中にエラーが発生しました: {str(e)}",
            "type": type(e).__name__
        }), 500



@auth_bp.route("/me_json", methods=["GET"])
def me_json():
    if "user_id" not in session:
        return jsonify({
            "ok": False,
            "logged_in": False
        }), 401

    # データベースからユーザー情報を取得（emailを含む）
    db = get_connection()
    try:
        with db:
            cur = db.cursor(cursor_factory=psycopg2.extras.DictCursor)
            cur.execute(
                "SELECT id, name, email, avatar, spicy_level, clean_level, comfortable_level, congestion_level FROM public.users WHERE id = %s",
                (session["user_id"],)
            )
            user = cur.fetchone()
            
            if not user:
                return jsonify({
                    "ok": False,
                    "logged_in": False
                }), 401
            
            return jsonify({
                "ok": True,
                "logged_in": True,
                "user": {
                    "id": user["id"],
                    "name": user["name"],
                    "email": user["email"],
                    "avatar": user["avatar"],
                    "spicy_level": user["spicy_level"],
                    "clean_level": user["clean_level"],
                    "comfortable_level": user["comfortable_level"],
                    "congestion_level": user["congestion_level"]
                }
            })
    except Exception as e:
        print(f"ユーザー情報取得エラー: {e}")
        return jsonify({
            "ok": False,
            "logged_in": False
        }), 500
    finally:
        db.close()



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


@auth_bp.route("/update_profile_json", methods=["POST"])
def update_profile_json():
    """ユーザープロフィール更新API（アバターと個人設定）"""
    if "user_id" not in session:
        return jsonify({"ok": False, "error": "ログインが必要です"}), 401
    
    user_id = session["user_id"]
    data = request.json
    
    avatar = data.get("avatar")
    spicy_level = data.get("spicy_level")
    clean_level = data.get("clean_level")
    comfortable_level = data.get("comfortable_level")
    congestion_level = data.get("congestion_level")
    
    # バリデーション
    if avatar and avatar not in [f"user_icon_{i}.png" for i in range(1, 11)]:
        return jsonify({"ok": False, "error": "無効なアバターです"}), 400
    
    if spicy_level is not None:
        try:
            spicy_level = int(spicy_level)
            if not (1 <= spicy_level <= 5):
                return jsonify({"ok": False, "error": "辛さレベルは1-5の範囲で入力してください"}), 400
        except (ValueError, TypeError):
            return jsonify({"ok": False, "error": "辛さレベルは数値で入力してください"}), 400
    
    if clean_level is not None:
        try:
            clean_level = int(clean_level)
            if not (1 <= clean_level <= 5):
                return jsonify({"ok": False, "error": "清潔度レベルは1-5の範囲で入力してください"}), 400
        except (ValueError, TypeError):
            return jsonify({"ok": False, "error": "清潔度レベルは数値で入力してください"}), 400
    
    if comfortable_level is not None:
        try:
            comfortable_level = int(comfortable_level)
            if not (1 <= comfortable_level <= 5):
                return jsonify({"ok": False, "error": "快適度レベルは1-5の範囲で入力してください"}), 400
        except (ValueError, TypeError):
            return jsonify({"ok": False, "error": "快適度レベルは数値で入力してください"}), 400
    
    if congestion_level is not None:
        try:
            congestion_level = int(congestion_level)
            if not (1 <= congestion_level <= 5):
                return jsonify({"ok": False, "error": "混雑度レベルは1-5の範囲で入力してください"}), 400
        except (ValueError, TypeError):
            return jsonify({"ok": False, "error": "混雑度レベルは数値で入力してください"}), 400
    
    # 更新するフィールドを構築
    updates = []
    params = []
    
    if avatar is not None:
        updates.append("avatar = %s")
        params.append(avatar)
    
    if spicy_level is not None:
        updates.append("spicy_level = %s")
        params.append(spicy_level)
    
    if clean_level is not None:
        updates.append("clean_level = %s")
        params.append(clean_level)
    
    if comfortable_level is not None:
        updates.append("comfortable_level = %s")
        params.append(comfortable_level)
    
    if congestion_level is not None:
        updates.append("congestion_level = %s")
        params.append(congestion_level)
    
    if not updates:
        return jsonify({"ok": False, "error": "更新する項目がありません"}), 400
    
    params.append(user_id)
    
    db = get_connection()
    try:
        with db:
            cur = db.cursor(cursor_factory=psycopg2.extras.DictCursor)
            query = f"UPDATE public.users SET {', '.join(updates)} WHERE id = %s RETURNING id, name, email, avatar, spicy_level, clean_level, comfortable_level, congestion_level"
            cur.execute(query, params)
            user = cur.fetchone()
            db.commit()
            
            if not user:
                return jsonify({"ok": False, "error": "ユーザーが見つかりません"}), 404
            
            return jsonify({
                "ok": True,
                "message": "プロフィールを更新しました",
                "user": {
                    "id": user["id"],
                    "name": user["name"],
                    "email": user["email"],
                    "avatar": user["avatar"],
                    "spicy_level": user["spicy_level"],
                    "clean_level": user["clean_level"],
                    "comfortable_level": user["comfortable_level"],
                    "congestion_level": user["congestion_level"]
                }
            })
    except Exception as e:
        import traceback
        error_msg = str(e)
        traceback.print_exc()
        print(f"プロフィール更新エラー: {error_msg}")
        return jsonify({"ok": False, "error": f"プロフィールの更新に失敗しました: {error_msg}"}), 500
    finally:
        if db:
            db.close()
