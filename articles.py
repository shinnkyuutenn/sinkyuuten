import os
import base64
from uuid import uuid4
from flask import Blueprint, request, jsonify, session
from werkzeug.utils import secure_filename
from db import get_connection
from datetime import datetime, timezone, timedelta
from pathlib import Path

article_bp = Blueprint("article", __name__)

#画像アップロード設定（絶対パスを使用）
BASE_DIR = Path(__file__).resolve().parent
UPLOAD_DIR = BASE_DIR / "static" / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

#時間表示（日本時間、分まで表示）
def time_ago(dt):
    if dt is None:
        return "不明"
    
    # JST（日本標準時）は UTC+9
    jst = timezone(timedelta(hours=9))
    
    # dt が naive の場合は UTC として扱い、JST に変換
    if dt.tzinfo is None:
        # naive datetime を UTC として扱う
        dt = dt.replace(tzinfo=timezone.utc)
    
    # UTC から JST に変換
    dt_jst = dt.astimezone(jst)
    
    # 日本時間でフォーマット（YYYY-MM-DD HH:MM）
    return dt_jst.strftime("%Y-%m-%d %H:%M")


# 画像URLを完全なURL形式に変換するヘルパー関数
def normalize_image_url(url):
    """
    相対パス（/static/uploads/xxx.jpg）を完全なURLに変換
    既に完全なURL（http://, https://, data:）の場合はそのまま返す
    """
    if not url:
        return url
    
    # 既に完全なURLの場合はそのまま返す
    if url.startswith(('http://', 'https://', 'data:')):
        return url
    
    # 相対パスの場合、完全なURLに変換
    if url.startswith('/'):
        try:
            # requestオブジェクトが利用可能な場合、完全なURLを生成
            base_url = request.url_root.rstrip('/')
            return f"{base_url}{url}"
        except RuntimeError:
            # requestコンテキスト外の場合は相対パスのまま返す
            # （通常は発生しないが、念のため）
            return url
    
    # その他の場合はそのまま返す
    return url


#画像アップロードしてから完全なURL形式で返す
@article_bp.route("/upload-image", methods=["POST"])
def upload_image():
    try:
        if "user_id" not in session:
            return jsonify({"ok": False, "error": "ログインが必要です"}), 401
        if "image" not in request.files:
            return jsonify({"ok": False, "error": "画像がありません"}), 400

        file = request.files["image"]
        if file.filename == "":
            return jsonify({"ok": False, "error": "ファイル名がありません"}), 400

        # ファイル拡張子のチェック
        ext = os.path.splitext(file.filename)[1].lower()
        allowed_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.webp'}
        if ext not in allowed_extensions:
            return jsonify({"ok": False, "error": "許可されていないファイル形式です"}), 400

        # ファイルサイズチェック（5MB以下）
        file.seek(0, os.SEEK_END)
        file_size = file.tell()
        file.seek(0)
        if file_size > 5 * 1024 * 1024:
            return jsonify({"ok": False, "error": "画像サイズは5MB以下にしてください"}), 400

        filename = secure_filename(f"{uuid4()}{ext}")
        save_path = UPLOAD_DIR / filename
        
        # ディレクトリが存在することを確認
        UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
        
        # ファイルを保存
        try:
            file.save(str(save_path))
        except Exception as save_error:
            print(f"ファイル保存エラー: {save_error}")
            import traceback
            traceback.print_exc()
            return jsonify({"ok": False, "error": f"ファイルの保存に失敗しました: {str(save_error)}"}), 500
        
        # ファイルが実際に保存されたか確認
        if not save_path.exists():
            return jsonify({"ok": False, "error": f"ファイルの保存に失敗しました（パス: {save_path}）"}), 500

        # 完全なURLを生成（プロトコル + ホスト + パス）
        base_url = request.url_root.rstrip('/')
        image_url = f"{base_url}/static/uploads/{filename}"
        
        return jsonify({"ok": True, "url": image_url}), 201
    except Exception as e:
        print(f"画像アップロードエラー: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"ok": False, "error": f"画像のアップロードに失敗しました: {str(e)}"}), 500

#記事投稿（管理者のみ）
@article_bp.route("/articles", methods=["POST"])
def create_article():
    if "user_id" not in session:
        return jsonify({"ok": False, "error": "ログインが必要です"}), 401

    user_id = session["user_id"]
    data = request.json
    title = data.get("title")
    body = data.get("body")
    thumbnail_url = data.get("thumbnail_url")
    hashtags = data.get("hashtags", [])
    status = data.get("status", "draft")

    if not title or not body:
        return jsonify({"ok": False, "error": "タイトルと本文は必須です"}), 400

    conn = None
    try:
        conn = get_connection()
        with conn:
            with conn.cursor() as cur:
                # 管理者チェック
                cur.execute("SELECT email FROM users WHERE id=%s", (user_id,))
                row = cur.fetchone()
                if not row or row[0] != "seika":
                    return jsonify({"ok": False, "error": "管理者権限が必要です"}), 403

                # hashtags を PostgreSQL の text[] 配列形式に変換
                if isinstance(hashtags, list):
                    # リスト内の要素を文字列に変換し、空のリストの場合は None にする
                    hashtags_array = [str(tag) for tag in hashtags] if hashtags else None
                else:
                    hashtags_array = None

                cur.execute("""
                    INSERT INTO articles (admin_id, title, body, thumbnail_url, hashtags, status)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    RETURNING id, created_at
                """, (user_id, title, body, thumbnail_url, hashtags_array, status))

                article_id, created_at = cur.fetchone()
                # created_at を日本時間で文字列に変換（JSON シリアライズ可能にする）
                jst = timezone(timedelta(hours=9))
                if created_at.tzinfo is None:
                    created_at = created_at.replace(tzinfo=timezone.utc)
                created_at_jst = created_at.astimezone(jst)
                created_at_str = created_at_jst.strftime("%Y-%m-%d %H:%M")
                return jsonify({"ok": True, "article_id": article_id, "created_at": created_at_str}), 201
    except Exception as e:
        print(f"記事作成エラー: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"ok": False, "error": f"記事の作成に失敗しました: {str(e)}"}), 500
    finally:
        if conn:
            conn.close()

#記事一覧
@article_bp.route("/articles", methods=["GET"])
def list_articles():
    user_id = session.get("user_id")
    is_admin = False

    if user_id:
        conn = get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("SELECT email FROM users WHERE id=%s", (user_id,))
                row = cur.fetchone()
                if row and row[0] == "seika":
                    is_admin = True
        finally:
            conn.close()

    conn = get_connection()
    try:
        with conn.cursor() as cur:
            if is_admin:
                #管理者はすべての記事を取得（下書きと公開済みを含む）
                if user_id:
                    cur.execute("""
                        SELECT a.id, a.title, a.thumbnail_url, a.created_at,
                               CASE WHEN f.id IS NULL THEN FALSE ELSE TRUE END,
                               a.status
                        FROM articles a
                        LEFT JOIN article_favorites f
                          ON a.id = f.article_id AND f.user_id=%s
                        ORDER BY a.created_at DESC
                    """, (user_id,))
                else:
                    # user_id がない場合（通常はないが、念のため）
                    cur.execute("""
                        SELECT a.id, a.title, a.thumbnail_url, a.created_at,
                               FALSE as is_favorite,
                               a.status
                        FROM articles a
                        ORDER BY a.created_at DESC
                    """)
            else:
                #一般ユーザーは公開記事のみ（ログインしていない場合も含む）
                if user_id:
                    cur.execute("""
                        SELECT a.id, a.title, a.thumbnail_url, a.created_at,
                               CASE WHEN f.id IS NULL THEN FALSE ELSE TRUE END,
                               a.status
                        FROM articles a
                        LEFT JOIN article_favorites f
                          ON a.id = f.article_id AND f.user_id=%s
                        WHERE a.status='published'
                        ORDER BY a.created_at DESC
                    """, (user_id,))
                else:
                    # 未ログインユーザーも公開記事を閲覧可能
                    cur.execute("""
                        SELECT a.id, a.title, a.thumbnail_url, a.created_at,
                               FALSE as is_favorite,
                               a.status
                        FROM articles a
                        WHERE a.status='published'
                        ORDER BY a.created_at DESC
                    """)

            rows = cur.fetchall()
            # JST タイムゾーン
            jst = timezone(timedelta(hours=9))
            
            return jsonify([
                {
                    "id": r[0],
                    "title": r[1],
                    "thumbnail_url": normalize_image_url(r[2]),
                    "created_at": time_ago(r[3]),  # 日本時間でフォーマット
                    "time_ago": time_ago(r[3]),
                    "is_favorite": r[4],
                    "status": r[5]
                }
                for r in rows
            ])
    finally:
        conn.close()

#自作記事一覧（ログインユーザーが作成した記事）
@article_bp.route("/articles/my", methods=["GET"])
def list_my_articles():
    if "user_id" not in session:
        return jsonify({"ok": False, "error": "ログインが必要です"}), 401
    
    user_id = session["user_id"]
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            # ユーザーが作成したすべての記事を取得（下書きと公開済みを含む）
            cur.execute("""
                SELECT a.id, a.title, a.thumbnail_url, a.created_at,
                       CASE WHEN f.id IS NULL THEN FALSE ELSE TRUE END,
                       a.status
                FROM articles a
                LEFT JOIN article_favorites f
                  ON a.id = f.article_id AND f.user_id=%s
                WHERE a.admin_id=%s
                ORDER BY a.created_at DESC
            """, (user_id, user_id))

            rows = cur.fetchall()
            # JST タイムゾーン
            jst = timezone(timedelta(hours=9))
            
            return jsonify([
                {
                    "id": r[0],
                    "title": r[1],
                    "thumbnail_url": normalize_image_url(r[2]),
                    "created_at": time_ago(r[3]),  # 日本時間でフォーマット
                    "time_ago": time_ago(r[3]),
                    "is_favorite": r[4],
                    "status": r[5]
                }
                for r in rows
            ])
    except Exception as e:
        print(f"自作記事取得エラー: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"ok": False, "error": f"記事の取得に失敗しました: {str(e)}"}), 500
    finally:
        conn.close()

#記事詳細
@article_bp.route("/articles/<int:article_id>", methods=["GET"])
def get_article(article_id):
    user_id = session.get("user_id")
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            # ログインユーザーの場合のみお気に入り情報を取得
            if user_id:
                cur.execute("""
                    SELECT a.id, a.title, a.body, a.thumbnail_url, a.hashtags, a.created_at,
                           CASE WHEN f.id IS NULL THEN FALSE ELSE TRUE END,
                           a.status
                    FROM articles a
                    LEFT JOIN article_favorites f
                      ON a.id = f.article_id AND f.user_id = %s
                    WHERE a.id=%s
                """, (user_id, article_id))
            else:
                # 未ログインユーザーの場合
                cur.execute("""
                    SELECT a.id, a.title, a.body, a.thumbnail_url, a.hashtags, a.created_at,
                           FALSE as is_favorite,
                           a.status
                    FROM articles a
                    WHERE a.id=%s
                """, (article_id,))
            r = cur.fetchone()
            if not r:
                return jsonify({"ok": False, "error": "記事が存在しません"}), 404
            
            # 管理者チェック（管理者はすべての記事を閲覧可能）
            is_admin = False
            if user_id:
                admin_conn = get_connection()
                try:
                    with admin_conn.cursor() as admin_cur:
                        admin_cur.execute("SELECT email FROM users WHERE id=%s", (user_id,))
                        admin_row = admin_cur.fetchone()
                        if admin_row and admin_row[0] == "seika":
                            is_admin = True
                finally:
                    admin_conn.close()
            
            # 下書き記事の場合、管理者または記事の作成者のみ閲覧可能
            # 公開記事はすべてのユーザーが閲覧可能（ログイン不要）
            if r[7] == "draft":
                if not is_admin:
                    # 管理者でない場合、記事の作成者のみ閲覧可能
                    cur.execute("SELECT admin_id FROM articles WHERE id=%s", (article_id,))
                    article_owner = cur.fetchone()
                    if not article_owner or (not user_id or article_owner[0] != user_id):
                        return jsonify({"ok": False, "error": "この記事は非公開です"}), 403

            # hashtags をリスト形式に変換（PostgreSQL の text[] 配列はリストとして返される）
            hashtags = r[4]
            if hashtags is None:
                hashtags = []
            elif not isinstance(hashtags, list):
                # 文字列やその他の形式の場合、リストに変換を試みる
                try:
                    import json as json_lib
                    hashtags = json_lib.loads(hashtags) if isinstance(hashtags, str) else [hashtags]
                except:
                    hashtags = []
            
            # created_at を日本時間でフォーマット
            jst = timezone(timedelta(hours=9))
            created_at = r[5]
            if created_at.tzinfo is None:
                created_at = created_at.replace(tzinfo=timezone.utc)
            created_at_jst = created_at.astimezone(jst)
            created_at_str = created_at_jst.strftime("%Y-%m-%d %H:%M")
            
            return jsonify({
                "id": r[0],
                "title": r[1],
                "body": r[2],
                "thumbnail_url": normalize_image_url(r[3]),
                "hashtags": hashtags,
                "created_at": created_at_str,
                "is_favorite": r[6],
                "status": r[7]
            })
    finally:
        conn.close()

#記事編集（管理者のみ）
@article_bp.route("/articles/<int:article_id>", methods=["PUT"])
def update_article(article_id):
    if "user_id" not in session:
        return jsonify({"ok": False, "error": "ログインが必要です"}), 401
    user_id = session["user_id"]
    data = request.json

    title = data.get("title")
    body = data.get("body")
    thumbnail_url = data.get("thumbnail_url")
    hashtags = data.get("hashtags", [])
    status = data.get("status", "draft")

    if not title or not body:
        return jsonify({"ok": False, "error": "タイトルと本文は必須です"}), 400

    conn = None
    try:
        conn = get_connection()
        with conn:
            with conn.cursor() as cur:
                #管理者チェック
                cur.execute("SELECT email FROM users WHERE id=%s", (user_id,))
                row = cur.fetchone()
                if not row or row[0] != "seika":
                    return jsonify({"ok": False, "error": "管理者権限が必要です"}), 403

                #記事あるかのチェック
                cur.execute("SELECT id FROM articles WHERE id=%s", (article_id,))
                if not cur.fetchone():
                    return jsonify({"ok": False, "error": "記事が存在しません"}), 404

                # hashtags を PostgreSQL の text[] 配列形式に変換
                if isinstance(hashtags, list):
                    # リスト内の要素を文字列に変換し、空のリストの場合は None にする
                    hashtags_array = [str(tag) for tag in hashtags] if hashtags else None
                else:
                    hashtags_array = None

                cur.execute("""
                    UPDATE articles
                    SET title=%s, body=%s, thumbnail_url=%s, hashtags=%s, status=%s, updated_at=NOW()
                    WHERE id=%s
                """, (title, body, thumbnail_url, hashtags_array, status, article_id))
                return jsonify({"ok": True})
    except Exception as e:
        print(f"記事更新エラー: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"ok": False, "error": f"記事の更新に失敗しました: {str(e)}"}), 500
    finally:
        if conn:
            conn.close()

#記事削除（管理者のみ）
@article_bp.route("/articles/<int:article_id>", methods=["DELETE"])
def delete_article(article_id):
    if "user_id" not in session:
        return jsonify({"ok": False, "error": "ログインが必要です"}), 401
    user_id = session["user_id"]
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            #管理者チェック
            cur.execute("SELECT email FROM users WHERE id=%s", (user_id,))
            row = cur.fetchone()
            if not row or row[0] != "seika":
                return jsonify({"ok": False, "error": "管理者権限が必要です"}), 403

            #削除
            cur.execute("DELETE FROM articles WHERE id=%s", (article_id,))
            conn.commit()
            return jsonify({"ok": True})
    finally:
        conn.close()

#お気に入り追加
@article_bp.route("/articles/<int:article_id>/favorite", methods=["POST"])
def add_favorite(article_id):
    if "user_id" not in session:
        return jsonify({"ok": False, "error": "ログインが必要です"}), 401
    user_id = session["user_id"]
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO article_favorites (user_id, article_id)
                VALUES (%s, %s)
                ON CONFLICT DO NOTHING
            """, (user_id, article_id))
            conn.commit()
            return jsonify({"ok": True})
    finally:
        conn.close()

#お気に入り削除
@article_bp.route("/articles/<int:article_id>/favorite", methods=["DELETE"])
def remove_favorite(article_id):
    if "user_id" not in session:
        return jsonify({"ok": False, "error": "ログインが必要です"}), 401
    user_id = session["user_id"]
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                DELETE FROM article_favorites
                WHERE user_id=%s AND article_id=%s
            """, (user_id, article_id))
            conn.commit()
            return jsonify({"ok": True})
    finally:
        conn.close()

#お気に入り記事一覧
@article_bp.route("/articles/favorites", methods=["GET"])
def list_favorite_articles():
    if "user_id" not in session:
        return jsonify({"ok": False, "error": "ログインが必要です"}), 401
    user_id = session["user_id"]
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT a.id, a.title, a.thumbnail_url, a.created_at, a.status
                FROM articles a
                INNER JOIN article_favorites f
                  ON a.id = f.article_id
                WHERE f.user_id=%s AND a.status='published'
                ORDER BY f.created_at DESC
            """, (user_id,))
            
            rows = cur.fetchall()
            return jsonify([
                {
                    "id": r[0],
                    "title": r[1],
                    "thumbnail_url": normalize_image_url(r[2]),
                    "created_at": time_ago(r[3]),
                    "time_ago": time_ago(r[3]),
                    "status": r[4],
                    "is_favorite": True
                }
                for r in rows
            ])
    except Exception as e:
        print(f"お気に入り記事取得エラー: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"ok": False, "error": f"お気に入り記事の取得に失敗しました: {str(e)}"}), 500
    finally:
        conn.close()
        
        
        
#記事検索（タイトルとハッシュタグ 部分一致）
@article_bp.route("/articles/search", methods=["GET"])
def search_articles():
    q = request.args.get("q", "").strip()
    if not q:
        return jsonify({"ok": False, "error": "検索キーワードを入力してください"}), 400

    user_id = session.get("user_id")
    is_admin = False

    if user_id:
        conn = get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute("SELECT email FROM users WHERE id=%s", (user_id,))
                row = cur.fetchone()
                if row and row[0] == "seika":
                    is_admin = True
        finally:
            conn.close()

    conn = get_connection()
    try:
        with conn.cursor() as cur:
            #部分一致用の文字列
            like_pattern = f"%{q}%"

            if is_admin:
                #管理者は全部の記事を検索できる
                cur.execute("""
                    SELECT a.id, a.title, a.thumbnail_url, a.created_at,
                           CASE WHEN f.id IS NULL THEN FALSE ELSE TRUE END,
                           a.status
                    FROM articles a
                    LEFT JOIN article_favorites f
                      ON a.id = f.article_id AND f.user_id=%s
                    WHERE a.title ILIKE %s OR EXISTS (
                        SELECT 1 FROM unnest(a.hashtags) AS h WHERE h ILIKE %s
                    )
                    ORDER BY a.created_at DESC
                """, (user_id, like_pattern, like_pattern))
            else:
                #一般ユーザーは公開記事のみ検索
                cur.execute("""
                    SELECT a.id, a.title, a.thumbnail_url, a.created_at,
                           CASE WHEN f.id IS NULL THEN FALSE ELSE TRUE END,
                           a.status
                    FROM articles a
                    LEFT JOIN article_favorites f
                      ON a.id = f.article_id AND f.user_id=%s
                    WHERE a.status='published' AND 
                          (a.title ILIKE %s OR EXISTS (
                              SELECT 1 FROM unnest(a.hashtags) AS h WHERE h ILIKE %s
                          ))
                    ORDER BY a.created_at DESC
                """, (user_id, like_pattern, like_pattern))

            rows = cur.fetchall()
            # JST タイムゾーン
            jst = timezone(timedelta(hours=9))
            
            return jsonify([
                {
                    "id": r[0],
                    "title": r[1],
                    "thumbnail_url": normalize_image_url(r[2]),
                    "created_at": time_ago(r[3]),  # 日本時間でフォーマット
                    "time_ago": time_ago(r[3]),
                    "is_favorite": r[4],
                    "status": r[5]
                }
                for r in rows
            ])
    finally:
        conn.close()