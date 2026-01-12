"""
店舗追加API
"""
from flask import Blueprint, request, session, jsonify
from flask_cors import CORS
import psycopg2.extras
import logging
from db import get_connection
from google_places import get_place_id_url, get_shop_photo_url, get_shop_info_from_url

# ロガー設定
logger = logging.getLogger(__name__)

add_shop_bp = Blueprint("add_shop", __name__)
CORS(add_shop_bp, supports_credentials=True)

# データベーススキーマの初期化（一度だけ実行）
_SCHEMA_INITIALIZED = False


def _ensure_schema_initialized(cur):
    """データベーススキーマを初期化（必要に応じて）"""
    global _SCHEMA_INITIALIZED
    
    if _SCHEMA_INITIALIZED:
        return
    
    try:
        # シーケンスを修正
        cur.execute("""
            SELECT setval('public.shops_id_seq', 
                COALESCE((SELECT MAX(id) FROM public.shops), 0) + 1, 
                false)
        """)
        
        # source_urlカラムが存在するか確認し、存在しない場合は追加
        cur.execute("""
            DO $$ 
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_schema = 'public' 
                    AND table_name = 'shops' 
                    AND column_name = 'source_url'
                ) THEN
                    ALTER TABLE public.shops 
                    ADD COLUMN source_url VARCHAR(1000);
                END IF;
            END $$;
        """)
        
        # photo_urlカラムの長さを確認し、必要に応じて拡張
        cur.execute("""
            DO $$ 
            BEGIN
                IF EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_schema = 'public' 
                    AND table_name = 'shops' 
                    AND column_name = 'photo_url'
                    AND character_maximum_length = 500
                ) THEN
                    ALTER TABLE public.shops 
                    ALTER COLUMN photo_url TYPE VARCHAR(2000);
                END IF;
            END $$;
        """)
        
        _SCHEMA_INITIALIZED = True
    except Exception as e:
        # スキーマ初期化エラーは無視（既に初期化済みの可能性）
        pass


def _check_column_exists(cur, table_name, column_name):
    """カラムが存在するかチェック"""
    cur.execute("""
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = %s 
        AND column_name = %s
    """, (table_name, column_name))
    return cur.fetchone() is not None


@add_shop_bp.route("/submit_url_json", methods=["POST"])
def submit_url_json():
    """URLを送信する（すべてのユーザー）"""
    data = request.json
    url = data.get("url", "").strip()
    
    if not url:
        return jsonify({"ok": False, "error": "URLを入力してください"}), 400
    
    # ログインユーザーID（オプション）
    submitted_by_user_id = None
    if "user_id" in session:
        submitted_by_user_id = session["user_id"]
    
    db = get_connection()
    try:
        with db:
            cur = db.cursor()
            
            # submitted_urlsテーブル作成（存在しない場合）
            try:
                cur.execute("""
                    CREATE TABLE IF NOT EXISTS public.submitted_urls (
                        id SERIAL PRIMARY KEY,
                        url TEXT NOT NULL,
                        submitted_by_user_id INTEGER,
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (submitted_by_user_id) REFERENCES public.users(id) ON DELETE SET NULL
                    )
                """)
                cur.execute("""
                    CREATE INDEX IF NOT EXISTS idx_submitted_urls_created_at 
                    ON public.submitted_urls(created_at DESC)
                """)
            except Exception:
                pass  # テーブルが既に存在する場合はスキップ
            
            # URLを保存
            cur.execute(
                """
                INSERT INTO public.submitted_urls (url, submitted_by_user_id)
                VALUES (%s, %s)
                RETURNING id
                """,
                (url, submitted_by_user_id)
            )
            url_id = cur.fetchone()[0]
            db.commit()
            
            return jsonify({
                "ok": True,
                "url_id": url_id,
                "message": "URLを送信しました"
            }), 201
            
    except Exception as e:
        db.rollback()
        return jsonify({"ok": False, "error": str(e)}), 500
    finally:
        db.close()


@add_shop_bp.route("/pending_urls_json", methods=["GET"])
def get_pending_urls_json():
    """送信されたURL一覧を取得（管理者専用）"""
    # 管理者チェック（emailが'seika'の場合）
    if "user_id" not in session:
        return jsonify({"ok": False, "error": "ログインが必要です"}), 401
    
    db = get_connection()
    try:
        with db:
            cur = db.cursor(cursor_factory=psycopg2.extras.DictCursor)
            
            # 管理者チェック
            cur.execute("SELECT email FROM public.users WHERE id = %s", (session["user_id"],))
            user = cur.fetchone()
            if not user or user["email"] != "seika":
                return jsonify({"ok": False, "error": "管理者権限が必要です"}), 403
            
            # すべてのURLを取得（時間順）
            cur.execute("""
                SELECT 
                    id, url, submitted_by_user_id, created_at,
                    (SELECT name FROM public.users WHERE id = submitted_by_user_id) as submitted_by_name
                FROM public.submitted_urls
                ORDER BY created_at DESC
            """)
            urls = cur.fetchall()
            
            return jsonify({
                "ok": True,
                "urls": [dict(url) for url in urls]
            }), 200
            
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500
    finally:
        db.close()


@add_shop_bp.route("/delete_url_json", methods=["POST"])
def delete_url_json():
    """URLを削除（管理者専用、店舗追加成功後に呼び出される）"""
    if "user_id" not in session:
        return jsonify({"ok": False, "error": "ログインが必要です"}), 401
    
    data = request.json
    url_id = data.get("url_id")
    
    if not url_id:
        return jsonify({"ok": False, "error": "url_idが必要です"}), 400
    
    db = get_connection()
    try:
        with db:
            cur = db.cursor()
            
            # 管理者チェック
            cur.execute("SELECT email FROM public.users WHERE id = %s", (session["user_id"],))
            user = cur.fetchone()
            if not user or user[0] != "seika":
                return jsonify({"ok": False, "error": "管理者権限が必要です"}), 403
            
            # URLを削除
            cur.execute(
                """
                DELETE FROM public.submitted_urls 
                WHERE id = %s
                """,
                (url_id,)
            )
            
            db.commit()
            
            return jsonify({
                "ok": True,
                "message": "URLを削除しました"
            }), 200
            
    except Exception as e:
        db.rollback()
        return jsonify({"ok": False, "error": str(e)}), 500
    finally:
        db.close()


@add_shop_bp.route("/get_shop_photo_from_url", methods=["POST", "OPTIONS"])
def get_shop_photo_from_url():
    # CORS 预检请求处理
    if request.method == 'OPTIONS':
        response = jsonify({})
        response.headers.add('Access-Control-Allow-Origin', request.headers.get('Origin', '*'))
        response.headers.add('Access-Control-Allow-Methods', 'POST, OPTIONS')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response
    """Google Maps URLから店舗写真を取得（ログインユーザー）"""
    # ログインチェック
    if "user_id" not in session:
        return jsonify({"ok": False, "error": "ログインが必要です"}), 401
    
    data = request.json
    maps_url = data.get("maps_url", "").strip()
    
    if not maps_url:
        return jsonify({"ok": False, "error": "Google Maps URLを入力してください"}), 400
    
    try:
        # 1. Google Maps URLからplace_idを取得
        place_id = get_place_id_url(maps_url)
        if not place_id:
            # デバッグ用：エラーメッセージにURLの一部を含める
            return jsonify({
                "ok": False,
                "error": f"Google Maps URLから場所を取得できませんでした。URL: {maps_url[:100]}..."
            }), 404
        
        # 2. place_idから写真URLを取得（最大3枚）
        photo_result = get_shop_photo_url(place_id, max_photos=3)
        if not photo_result:
            return jsonify({
                "ok": False,
                "error": "店舗の写真が見つかりませんでした"
            }), 404
        
        # 写真URLをリストに統一
        if isinstance(photo_result, str):
            photo_urls = [photo_result]
        else:
            photo_urls = photo_result
        
        return jsonify({
            "ok": True,
            "photo_urls": photo_urls,  # 常にリスト形式で返す
            "place_id": place_id
        }), 200
        
    except Exception as e:
        logger.exception("Error in get_shop_photo_from_url")
        return jsonify({
            "ok": False,
            "error": f"写真の取得に失敗しました: {str(e)}"
        }), 500


@add_shop_bp.route("/get_shop_info_from_url", methods=["POST", "OPTIONS"])
def get_shop_info_from_url_endpoint():
    # CORS 预检请求处理
    if request.method == 'OPTIONS':
        response = jsonify({})
        response.headers.add('Access-Control-Allow-Origin', request.headers.get('Origin', '*'))
        response.headers.add('Access-Control-Allow-Methods', 'POST, OPTIONS')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response
    """Google Maps URLから店舗情報を取得（名称、緯度、経度、写真URL）（ログインユーザー）"""
    # ログインチェック
    if "user_id" not in session:
        return jsonify({"ok": False, "error": "ログインが必要です"}), 401
    
    data = request.json
    maps_url = data.get("maps_url", "").strip()
    
    if not maps_url:
        return jsonify({"ok": False, "error": "Google Maps URLを入力してください"}), 400
    
    try:
        # Google Maps URLから店舗情報を取得
        shop_info = get_shop_info_from_url(maps_url)
        if not shop_info:
            return jsonify({
                "ok": False,
                "error": "Google Maps URLから店舗情報を取得できませんでした"
            }), 404
        
        return jsonify({
            "ok": True,
            "name": shop_info.get("name", ""),
            "latitude": shop_info.get("latitude"),
            "longitude": shop_info.get("longitude"),
            "photo_urls": shop_info.get("photo_urls", [])
        }), 200
        
    except Exception as e:
        logger.exception("Error in get_shop_info_from_url_endpoint")
        return jsonify({
            "ok": False,
            "error": f"店舗情報の取得に失敗しました: {str(e)}"
        }), 500


@add_shop_bp.route("/add_shop_json", methods=["POST"])
def add_shop_json():
    """店舗を追加する（管理者または一般ユーザー）"""
    # ログイン必須
    if "user_id" not in session:
        return jsonify({"ok": False, "error": "ログインが必要です"}), 401
    
    user_id = session["user_id"]
    data = request.json
    
    # 必須項目チェック
    required_fields = ["name", "shop_type", "city_id", "latitude", "longitude"]
    for field in required_fields:
        if not data.get(field):
            return jsonify({"ok": False, "error": f"{field} は必須です"}), 400
    
    name = data.get("name", "").strip()
    shop_type = data.get("shop_type", "").strip()
    city_id = data.get("city_id", "").strip()
    latitude = float(data.get("latitude", 0))
    longitude = float(data.get("longitude", 0))
    
    # 評価レベル（NULL - ユーザーレビューから計算される）
    spicy_level = data.get("spicy_level") if data.get("spicy_level") is not None else None
    clean_level = data.get("clean_level") if data.get("clean_level") is not None else None
    comfortable_level = data.get("comfortable_level") if data.get("comfortable_level") is not None else None
    congestion_level = data.get("congestion_level") if data.get("congestion_level") is not None else None
    
    # 平均評価（NULL - ユーザーレビューから計算される）
    avg_rating = data.get("avg_rating") if data.get("avg_rating") is not None else None
    
    # 写真URL（カンマ区切り、最大3つ）
    photo_url = data.get("photo_url", "").strip()
    # データベースのVARCHAR(2000)制限に合わせて truncate（拡張後）
    if len(photo_url) > 2000:
        photo_url = photo_url[:2000]
    
    # キーワード（配列、最大4つ）
    keywords = data.get("keywords", [])
    if isinstance(keywords, str):
        keywords = [k.strip() for k in keywords.split(",") if k.strip()]
    keywords = [k.strip() for k in keywords if k.strip()][:4]
    
    # 送信元URL（オプション）
    source_url = data.get("source_url", "").strip()
    # データベースのVARCHAR(1000)制限に合わせて truncate（もしあれば）
    if len(source_url) > 1000:
        source_url = source_url[:1000]
    # データベースのVARCHAR(500)制限に合わせて truncate（もしあれば）
    if len(source_url) > 500:
        source_url = source_url[:500]
    
    # 送信ユーザーID（URLを送信したユーザー、オプション）
    submitted_by_user_id = data.get("submitted_by_user_id", user_id)
    
    db = get_connection()
    try:
        with db:
            cur = db.cursor()
            
            # データベーススキーマを初期化（必要に応じて）
            _ensure_schema_initialized(cur)
            
            # source_urlカラムが存在するかチェック
            has_source_url = _check_column_exists(cur, 'shops', 'source_url')
            
            if has_source_url:
                cur.execute(
                    """
                    INSERT INTO public.shops
                    (name, shop_type, city_id, latitude, longitude,
                     spicy_level, clean_level, comfortable_level, congestion_level,
                     photo_url, avg_rating, source_url)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    RETURNING id
                    """,
                    (name, shop_type, city_id, latitude, longitude,
                     spicy_level, clean_level, comfortable_level, congestion_level,
                     photo_url, avg_rating, source_url)
                )
            else:
                cur.execute(
                    """
                    INSERT INTO public.shops
                    (name, shop_type, city_id, latitude, longitude,
                     spicy_level, clean_level, comfortable_level, congestion_level,
                     photo_url, avg_rating)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    RETURNING id
                    """,
                    (name, shop_type, city_id, latitude, longitude,
                     spicy_level, clean_level, comfortable_level, congestion_level,
                     photo_url, avg_rating)
                )
            shop_id = cur.fetchone()[0]
            
            # 2. キーワードを追加（既存のキーワードを使用、なければ作成）
            for keyword in keywords:
                # キーワードが存在するかチェック
                cur.execute("SELECT id FROM public.keywords WHERE word = %s", (keyword,))
                keyword_row = cur.fetchone()
                
                if keyword_row:
                    keyword_id = keyword_row[0]
                else:
                    # 新しいキーワードを作成
                    cur.execute(
                        "INSERT INTO public.keywords (word) VALUES (%s) RETURNING id",
                        (keyword,)
                    )
                    keyword_id = cur.fetchone()[0]
                
                # 店舗とキーワードを関連付け
                cur.execute(
                    """
                    INSERT INTO public.shop_keywords (shop_id, keyword_id)
                    VALUES (%s, %s)
                    ON CONFLICT (shop_id, keyword_id) DO NOTHING
                    """,
                    (shop_id, keyword_id)
                )
            
            # 5. 送信ユーザーIDを記録
            if submitted_by_user_id:
                # submitted_by_user_idカラムが存在するかチェック
                if _check_column_exists(cur, 'shops', 'submitted_by_user_id'):
                    cur.execute(
                        "UPDATE public.shops SET submitted_by_user_id = %s WHERE id = %s",
                        (submitted_by_user_id, shop_id)
                    )
            
            # 4. URLを送信したユーザー（submitted_by_user_id）のお気に入りに自動追加
            # 管理者ではなく、URLを送信したユーザーにお気に入りを追加
            favorite_user_id = submitted_by_user_id if submitted_by_user_id else user_id
            if favorite_user_id:
                cur.execute(
                    """
                    INSERT INTO public.user_favorites (user_id, shop_id)
                    VALUES (%s, %s)
                    ON CONFLICT (user_id, shop_id) DO NOTHING
                    """,
                    (favorite_user_id, shop_id)
                )
            
            db.commit()
            
            return jsonify({
                "ok": True,
                "shop_id": shop_id,
                "message": "店舗を追加しました"
            }), 201
            
    except Exception as e:
        db.rollback()
        return jsonify({"ok": False, "error": str(e)}), 500
    finally:
        db.close()

