#!/usr/bin/env python3
"""
Neon 数据库迁移脚本
将数据从一个 Neon 数据库迁移到另一个 Neon 数据库
"""
import os
import sys
from pathlib import Path
import psycopg2
from psycopg2.extras import RealDictCursor
from urllib.parse import urlparse

def _load_dotenv_if_present():
    """プロジェクトルートの.envファイルを読み込む（外部依存なし）"""
    env_path = Path(__file__).resolve().parent / ".env"
    if not env_path.exists():
        return
    try:
        content = env_path.read_text(encoding="utf-8")
    except Exception:
        return

    for raw_line in content.splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#"):
            continue
        if line.startswith("export "):
            line = line[len("export ") :].strip()
        if "=" not in line:
            continue
        key, val = line.split("=", 1)
        key = key.strip()
        val = val.strip()
        # 引用符を除去
        if (val.startswith('"') and val.endswith('"')) or (val.startswith("'") and val.endswith("'")):
            val = val[1:-1]
        if key and key not in os.environ:
            os.environ[key] = val

_load_dotenv_if_present()

def get_connection(database_url):
    """データベース接続を取得"""
    if not database_url:
        raise ValueError("データベース接続文字列が必要です")
    
    # channel_binding=require を除去
    clean_url = database_url.replace('&channel_binding=require', '').replace('?channel_binding=require', '')
    
    try:
        conn = psycopg2.connect(clean_url)
        return conn
    except Exception as e:
        print(f"❌ データベース接続エラー: {e}")
        raise

def get_table_list(conn):
    """テーブル一覧を取得"""
    with conn.cursor() as cur:
        cur.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
            ORDER BY table_name;
        """)
        return [row[0] for row in cur.fetchall()]

def export_table_data(conn, table_name):
    """テーブルのデータをエクスポート"""
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(f"SELECT * FROM {table_name};")
        return cur.fetchall()

def import_table_data(conn, table_name, data):
    """テーブルにデータをインポート"""
    if not data:
        print(f"  ⚠️  {table_name}: データなし、スキップ")
        return 0
    
    cur = conn.cursor()
    try:
        # テーブル構造を取得
        cur.execute(f"""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = '{table_name}' 
            AND table_schema = 'public'
            ORDER BY ordinal_position;
        """)
        columns = [row[0] for row in cur.fetchall()]
        
        if not columns:
            print(f"  ⚠️  {table_name}: カラムが見つかりません")
            return 0
        
        # データを挿入
        placeholders = ', '.join(['%s'] * len(columns))
        column_names = ', '.join(columns)
        
        # 既存データを削除（オプション）
        cur.execute(f"TRUNCATE TABLE {table_name} CASCADE;")
        
        # データを挿入（トランザクション内で）
        insert_count = 0
        for row in data:
            values = []
            for col in columns:
                val = row.get(col)
                # 文字列の長さをチェック（VARCHAR制約対応）
                if val and isinstance(val, str):
                    # 長すぎる場合は切り詰め（警告付き）
                    if len(val) > 1000:  # 安全な最大長
                        print(f"    ⚠️  {table_name}.{col}: 値が長すぎます（{len(val)}文字）、切り詰めます")
                        val = val[:1000]
                values.append(val)
            
            try:
                cur.execute(
                    f"INSERT INTO {table_name} ({column_names}) VALUES ({placeholders});",
                    values
                )
                insert_count += 1
            except Exception as e:
                print(f"    ⚠️  行の挿入エラー: {e}")
                conn.rollback()  # エラー時はロールバックして続行
                cur = conn.cursor()  # 新しいカーソルを取得
                continue
        
        conn.commit()
        return insert_count
    except Exception as e:
        conn.rollback()
        print(f"  ❌ {table_name}: インポートエラー: {e}")
        return 0

def migrate_database():
    """データベースを移行"""
    print("=" * 60)
    print("Neon データベース移行スクリプト")
    print("=" * 60)
    print()
    
    # ソースデータベース接続文字列
    print("📥 ソースデータベース（移行元）の接続文字列を入力してください：")
    print("   または環境変数 SOURCE_NEON_DATABASE_URL を設定してください")
    source_url = os.getenv('SOURCE_NEON_DATABASE_URL')
    if not source_url:
        source_url = input("接続文字列: ").strip()
    
    if not source_url:
        print("❌ エラー: ソースデータベース接続文字列が必要です")
        sys.exit(1)
    
    # ターゲットデータベース接続文字列
    print()
    print("📤 ターゲットデータベース（移行先）の接続文字列を入力してください：")
    print("   または環境変数 TARGET_NEON_DATABASE_URL を設定してください")
    target_url = os.getenv('TARGET_NEON_DATABASE_URL')
    if not target_url:
        target_url = input("接続文字列: ").strip()
    
    if not target_url:
        print("❌ エラー: ターゲットデータベース接続文字列が必要です")
        sys.exit(1)
    
    print()
    print("🔄 データ移行を開始します...")
    print()
    
    # ソースデータベースに接続
    try:
        print("📥 ソースデータベースに接続中...")
        source_conn = get_connection(source_url)
        print("✅ ソースデータベース接続成功")
    except Exception as e:
        print(f"❌ ソースデータベース接続失敗: {e}")
        sys.exit(1)
    
    # ターゲットデータベースに接続
    try:
        print("📤 ターゲットデータベースに接続中...")
        target_conn = get_connection(target_url)
        print("✅ ターゲットデータベース接続成功")
    except Exception as e:
        print(f"❌ ターゲットデータベース接続失敗: {e}")
        source_conn.close()
        sys.exit(1)
    
    try:
        # テーブル一覧を取得
        print()
        print("📋 テーブル一覧を取得中...")
        tables = get_table_list(source_conn)
        print(f"✅ {len(tables)} 個のテーブルが見つかりました: {', '.join(tables)}")
        
        # テーブルの依存関係順にソート（外部キー制約を考慮）
        # 基本的な順序: users -> shops -> keywords -> shop_keywords -> その他
        table_order = ['users', 'shops', 'keywords', 'shop_keywords', 'articles', 
                      'users_review', 'user_favorites', 'article_favorites', 'submitted_urls']
        
        # 順序に従ってテーブルを並び替え（存在するもののみ）
        ordered_tables = [t for t in table_order if t in tables]
        # 順序にないテーブルを追加
        ordered_tables.extend([t for t in tables if t not in table_order])
        
        # 各テーブルのデータを移行
        print()
        print("🔄 データ移行を開始します...")
        print()
        
        total_rows = 0
        for table_name in ordered_tables:
            print(f"📦 {table_name} を移行中...")
            try:
                # データをエクスポート
                data = export_table_data(source_conn, table_name)
                print(f"  📥 {len(data)} 行をエクスポート")
                
                # データをインポート
                imported = import_table_data(target_conn, table_name, data)
                print(f"  📤 {imported} 行をインポート")
                total_rows += imported
            except Exception as e:
                print(f"  ❌ エラー: {e}")
                import traceback
                traceback.print_exc()
                continue
        
        print()
        print("=" * 60)
        print(f"✅ データ移行が完了しました！")
        print(f"   合計 {total_rows} 行のデータを移行しました")
        print("=" * 60)
        
    finally:
        source_conn.close()
        target_conn.close()
        print()
        print("🔌 データベース接続を閉じました")

if __name__ == "__main__":
    try:
        migrate_database()
    except KeyboardInterrupt:
        print()
        print("⚠️  移行が中断されました")
        sys.exit(1)
    except Exception as e:
        print()
        print(f"❌ 予期しないエラー: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

