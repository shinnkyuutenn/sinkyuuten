from db import query

def search_shops(shop_type=None, min_spicy=None, min_clean=None, min_comfort=None, min_congestion=None, keyword=None):
    sql = """
        SELECT DISTINCT s.id, s.name, s.shop_type, s.spicy_level, s.clean_level, 
                        s.comfortable_level, s.congestion_level, s.avg_rating, s.photo_url
        FROM shops s
        LEFT JOIN shop_keywords sk ON s.id = sk.shop_id
        LEFT JOIN keywords k ON sk.keyword_id = k.id
        WHERE 1=1
    """
    params = []

    if keyword:
        sql += " AND (s.name ILIKE %s OR k.word ILIKE %s)"
        params.extend([f"%{keyword}%", f"%{keyword}%"])

    if shop_type:
        sql += " AND s.shop_type = %s"
        params.append(shop_type)

    if min_spicy is not None:
        sql += " AND s.spicy_level >= %s"
        params.append(min_spicy)

    if min_clean is not None:
        sql += " AND s.clean_level >= %s"
        params.append(min_clean)

    if min_comfort is not None:
        sql += " AND s.comfortable_level >= %s"
        params.append(min_comfort)

    if min_congestion is not None:
        sql += " AND s.congestion_level >= %s"
        params.append(min_congestion)

    return query(sql, params)




