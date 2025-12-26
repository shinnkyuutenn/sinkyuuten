"""
店舗追加API
"""
from flask import Blueprint, request, session, jsonify
from flask_cors import CORS
import psycopg2.extras
from db import get_connection

add_shop_bp = Blueprint("add_shop", __name__)
CORS(add_shop_bp, supports_credentials=True)


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
    
    # キーワード（配列、最大4つ）
    keywords = data.get("keywords", [])
    if isinstance(keywords, str):
        keywords = [k.strip() for k in keywords.split(",") if k.strip()]
    keywords = [k.strip() for k in keywords if k.strip()][:4]
    
    # 送信元URL（オプション）
    source_url = data.get("source_url", "").strip()
    
    # 送信ユーザーID（URLを送信したユーザー、オプション）
    submitted_by_user_id = data.get("submitted_by_user_id", user_id)
    
    db = get_connection()
    try:
        with db:
            cur = db.cursor()
            
            # 1. 店舗を追加
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
            
            # 3. 送信ユーザーIDを記録
            try:
                cur.execute(
                    """
                    DO $$ 
                    BEGIN
                        IF NOT EXISTS (
                            SELECT 1 FROM information_schema.columns 
                            WHERE table_schema = 'public' 
                            AND table_name = 'shops' 
                            AND column_name = 'submitted_by_user_id'
                        ) THEN
                            ALTER TABLE public.shops 
                            ADD COLUMN submitted_by_user_id INTEGER;
                        END IF;
                    END $$;
                    """
                )
                if submitted_by_user_id:
                    cur.execute(
                        "UPDATE public.shops SET submitted_by_user_id = %s WHERE id = %s",
                        (submitted_by_user_id, shop_id)
                    )
            except Exception:
                pass  # カラムが既に存在する場合はスキップ
            
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

