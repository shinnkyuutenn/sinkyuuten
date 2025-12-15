from db import query

def search_shops(
    shop_type=None,
    min_spicy=None,
    min_clean=None,
    min_comfort=None,
    min_congestion=None,
    keyword=None,
    city=None
):
    """
    店舗検索
    ・レベル系の 0 または None は「条件なし」として扱う
    """

    sql = """
        SELECT DISTINCT
            s.id,
            s.name,
            s.shop_type,
            s.spicy_level,
            s.clean_level,
            s.comfortable_level,
            s.congestion_level,
            s.avg_rating,
            s.photo_url,
            s.city_id
        FROM shops s
        LEFT JOIN shop_keywords sk ON s.id = sk.shop_id
        LEFT JOIN keywords k ON sk.keyword_id = k.id
        WHERE 1=1
    """

    params = []

    # ----------------------------
    # キーワード検索
    # ----------------------------
    if keyword and keyword.strip():
        sql += " AND (s.name ILIKE %s OR k.word ILIKE %s)"
        params.extend([f"%{keyword.strip()}%", f"%{keyword.strip()}%"])

    # ----------------------------
    # 店舗タイプ
    # ----------------------------
    # if shop_type and shop_type.strip():
    #     sql += " AND s.shop_type = %s"
    #     params.append(shop_type.strip())
        
    if shop_type and shop_type.strip():
        sql += " AND s.shop_type = %s"
        params.append(shop_type.strip())
    else:
        # 未選択なら全タイプ対象（何もしない）
        pass

    # ----------------------------
    # 都市
    # ----------------------------
    # if city and city.strip():
    #     sql += " AND LOWER(s.city_id) = LOWER(%s)"  
    #     params.append(city.strip())
        
    if city and city.strip():
        sql += " AND LOWER(s.city_id) = LOWER(%s)"  # 大文字小文字無視
        params.append(city.strip())
    else:
        # 未選択なら全都市対象（何もしない）
        pass

    # ----------------------------
    # レベル系（0 または None は無視）
    # ----------------------------
    if min_spicy is not None and min_spicy > 0:
        sql += " AND s.spicy_level >= %s"
        params.append(min_spicy)

    if min_clean is not None and min_clean > 0:
        sql += " AND s.clean_level >= %s"
        params.append(min_clean)

    if min_comfort is not None and min_comfort > 0:
        sql += " AND s.comfortable_level >= %s"
        params.append(min_comfort)

    if min_congestion is not None and min_congestion > 0:
        sql += " AND s.congestion_level >= %s"
        params.append(min_congestion)

    # ----------------------------
    # 並び順
    # ----------------------------
    sql += " ORDER BY s.avg_rating DESC"

    return query(sql, params)

