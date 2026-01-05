import os
from uuid import uuid4
from flask import Blueprint, request, jsonify, session
from werkzeug.utils import secure_filename
from db import get_connection
from datetime import datetime, timezone

article_bp = Blueprint("article", __name__)

#画像アップロード設定
UPLOAD_DIR = "static/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

#時間表示
def time_ago(dt):
    now = datetime.now(timezone.utc)
    diff = now - dt
    days = diff.days
    if days < 1:
        return "今日"
    elif days < 7:
        return f"{days}日前"
    elif days < 30:
        return f"{days // 7}週間前"
    else:
        return f"{days // 30}か月前"


#画像アップロードしてからURL化
@article_bp.route("/upload-image", methods=["POST"])
def upload_image():
    if "user_id" not in session:
        return jsonify({"ok": False, "error": "ログインが必要です"}), 401
    if "image" not in request.files:
        return jsonify({"ok": False, "error": "画像がありません"}), 400

    file = request.files["image"]
    if file.filename == "":
        return jsonify({"ok": False, "error": "ファイル名がありません"}), 400

    ext = os.path.splitext(file.filename)[1]
    filename = secure_filename(f"{uuid4()}{ext}")
    save_path = os.path.join(UPLOAD_DIR, filename)
    file.save(save_path)

    image_url = f"/static/uploads/{filename}"
    return jsonify({"ok": True, "url": image_url}), 201

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

    conn = get_connection()
    try:
        with conn.cursor() as cur:
            # 管理者チェック
            cur.execute("SELECT email FROM users WHERE id=%s", (user_id,))
            row = cur.fetchone()
            if not row or row[0] != "seika":
                return jsonify({"ok": False, "error": "管理者権限が必要です"}), 403

            cur.execute("""
                INSERT INTO articles (admin_id, title, body, thumbnail_url, hashtags, status)
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING id, created_at
            """, (user_id, title, body, thumbnail_url, hashtags, status))

            article_id, created_at = cur.fetchone()
            conn.commit()
            return jsonify({"ok": True, "article_id": article_id, "created_at": created_at}), 201
    finally:
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
                #管理者はすべての記事を取得
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
                #一般ユーザーは公開記事のみ
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

            rows = cur.fetchall()
            return jsonify([
                {
                    "id": r[0],
                    "title": r[1],
                    "thumbnail_url": r[2],
                    "created_at": r[3],
                    "time_ago": time_ago(r[3]),
                    "is_favorite": r[4],
                    "status": r[5]
                }
                for r in rows
            ])
    finally:
        conn.close()

#記事詳細
@article_bp.route("/articles/<int:article_id>", methods=["GET"])
def get_article(article_id):
    user_id = session.get("user_id")
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT a.id, a.title, a.body, a.thumbnail_url, a.hashtags, a.created_at,
                       CASE WHEN f.id IS NULL THEN FALSE ELSE TRUE END,
                       a.status
                FROM articles a
                LEFT JOIN article_favorites f
                  ON a.id = f.article_id AND f.user_id = %s
                WHERE a.id=%s
            """, (user_id, article_id))
            r = cur.fetchone()
            if not r:
                return jsonify({"ok": False, "error": "記事が存在しません"}), 404
            if r[7] == "draft" and (not user_id or r[0] != user_id):
                return jsonify({"ok": False, "error": "この記事は非公開です"}), 403

            return jsonify({
                "id": r[0],
                "title": r[1],
                "body": r[2],
                "thumbnail_url": r[3],
                "hashtags": r[4],
                "created_at": r[5],
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

    conn = get_connection()
    try:
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

            cur.execute("""
                UPDATE articles
                SET title=%s, body=%s, thumbnail_url=%s, hashtags=%s, status=%s, updated_at=NOW()
                WHERE id=%s
            """, (title, body, thumbnail_url, hashtags, status, article_id))
            conn.commit()
            return jsonify({"ok": True})
    finally:
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
            return jsonify([
                {
                    "id": r[0],
                    "title": r[1],
                    "thumbnail_url": r[2],
                    "created_at": r[3],
                    "time_ago": time_ago(r[3]),
                    "is_favorite": r[4],
                    "status": r[5]
                }
                for r in rows
            ])
    finally:
        conn.close()