"""
店舗の評価をユーザーレビューの平均から自動計算して更新するスクリプト
"""
import psycopg2
from db import get_connection

def update_shop_ratings():
    """店舗の評価をユーザーレビューの平均から計算して更新"""
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        
        # 各店舗のレビュー平均を計算して更新
        # 注意: users_reviewテーブルのフィールド名にスペースが含まれているため注意
        update_query = """
            UPDATE public.shops s
            SET 
                spicy_level = CASE 
                    WHEN review_stats.avg_spicy IS NOT NULL 
                    THEN LEAST(5, GREATEST(1, ROUND(review_stats.avg_spicy)::integer))
                    ELSE NULL 
                END,
                clean_level = CASE 
                    WHEN review_stats.avg_clean IS NOT NULL 
                    THEN LEAST(5, GREATEST(1, ROUND(review_stats.avg_clean)::integer))
                    ELSE NULL 
                END,
                comfortable_level = CASE 
                    WHEN review_stats.avg_comfortable IS NOT NULL 
                    THEN LEAST(5, GREATEST(1, ROUND(review_stats.avg_comfortable)::integer))
                    ELSE NULL 
                END,
                congestion_level = CASE 
                    WHEN review_stats.avg_congestion IS NOT NULL 
                    THEN LEAST(5, GREATEST(1, ROUND(review_stats.avg_congestion)::integer))
                    ELSE NULL 
                END,
                avg_rating = review_stats.avg_avg_rating
            FROM (
                SELECT 
                    shop_id,
                    AVG(spicy_level)::numeric(3,2) as avg_spicy,
                    AVG(clean_level)::numeric(3,2) as avg_clean,
                    AVG(" comfortable_level")::numeric(3,2) as avg_comfortable,
                    AVG(" congestion_level")::numeric(3,2) as avg_congestion,
                    AVG(avg_rating)::numeric(3,2) as avg_avg_rating
                FROM public.users_review
                GROUP BY shop_id
            ) review_stats
            WHERE s.id = review_stats.shop_id
        """
        
        cur.execute(update_query)
        updated_count = cur.rowcount
        conn.commit()
        
        print(f"✅ {updated_count}件の店舗の評価を更新しました")
        
        # 更新された店舗の詳細を表示
        cur.execute("""
            SELECT id, name, spicy_level, clean_level, comfortable_level, congestion_level, avg_rating
            FROM public.shops
            WHERE spicy_level IS NOT NULL 
               OR clean_level IS NOT NULL 
               OR comfortable_level IS NOT NULL 
               OR congestion_level IS NOT NULL 
               OR avg_rating IS NOT NULL
            ORDER BY id
            LIMIT 10
        """)
        shops = cur.fetchall()
        
        if shops:
            print("\n更新された店舗の例（最初の10件）:")
            print("-" * 80)
            for shop in shops:
                print(f"ID: {shop[0]}, 名前: {shop[1]}")
                print(f"  辛さ: {shop[2]}, 清潔度: {shop[3]}, 快適度: {shop[4]}, 混雑度: {shop[5]}, 総合: {shop[6]}")
        
    except Exception as e:
        print(f"❌ エラーが発生しました: {e}")
        import traceback
        traceback.print_exc()
        if conn:
            conn.rollback()
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    update_shop_ratings()

