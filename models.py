from db import query

def search_shops(
    shop_type=None,
    keywords=None,
    sort_by="rating",
    sort_dir="desc",
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
        SELECT
            s.id,
            s.name,
            s.shop_type,
            s.spicy_level,
            s.clean_level,
            s.comfortable_level,
            s.congestion_level,
            (s.avg_rating)::float8 as avg_rating,
            s.photo_url,
            s.city_id,
            (s.latitude)::float8 as latitude,
            (s.longitude)::float8 as longitude,
            COALESCE(
              json_agg(DISTINCT k_all.word) FILTER (WHERE k_all.word IS NOT NULL),
              '[]'::json
            ) as keywords
        FROM public.shops s
        LEFT JOIN public.shop_keywords sk_all ON s.id = sk_all.shop_id
        LEFT JOIN public.keywords k_all ON sk_all.keyword_id = k_all.id
        WHERE 1=1
    """

    params = []

    # ----------------------------
    # キーワード検索
    # ----------------------------
    if keyword and keyword.strip():
        q = keyword.strip()
        sql += """
          AND (
            s.name ILIKE %s
            OR EXISTS (
              SELECT 1
              FROM public.shop_keywords skf
              JOIN public.keywords kf ON skf.keyword_id = kf.id
              WHERE skf.shop_id = s.id AND kf.word ILIKE %s
            )
          )
        """
        params.extend([f"%{q}%", f"%{q}%"])

    # ----------------------------
    # 店舗タイプ
    # ----------------------------
    # if shop_type and shop_type.strip():
    #     sql += " AND s.shop_type = %s"
    #     params.append(shop_type.strip())
        
    if shop_type and shop_type.strip():
        # Support multi-select: "restaurant,hotel,spot"
        types = [t.strip() for t in shop_type.split(",") if t.strip()]
        if len(types) == 1:
            sql += " AND s.shop_type = %s"
            params.append(types[0])
        elif len(types) > 1:
            sql += " AND s.shop_type = ANY(%s)"
            params.append(types)
    else:
        # 未選択なら全タイプ対象（何もしない）
        pass

    # ----------------------------
    # キーワード（選択式: keywords=word1,word2）
    # ----------------------------
    if keywords and str(keywords).strip():
        selected = [t.strip() for t in str(keywords).split(",") if t.strip()]
        if len(selected) == 1:
            sql += """
              AND EXISTS (
                SELECT 1
                FROM public.shop_keywords sks
                JOIN public.keywords ks ON sks.keyword_id = ks.id
                WHERE sks.shop_id = s.id AND ks.word = %s
              )
            """
            params.append(selected[0])
        elif len(selected) > 1:
            sql += """
              AND EXISTS (
                SELECT 1
                FROM public.shop_keywords sks
                JOIN public.keywords ks ON sks.keyword_id = ks.id
                WHERE sks.shop_id = s.id AND ks.word = ANY(%s)
              )
            """
            params.append(selected)

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
    # GROUP BY + 並び順
    # ----------------------------
    sql += """
      GROUP BY
        s.id, s.name, s.shop_type, s.spicy_level, s.clean_level,
        s.comfortable_level, s.congestion_level, s.avg_rating,
        s.photo_url, s.city_id, s.latitude, s.longitude
    """

    sort_by_map = {
        "spicy": "s.spicy_level",
        "clean": "s.clean_level",
        "comfort": "s.comfortable_level",
        "crowd": "s.congestion_level",
        "rating": "s.avg_rating",
    }
    col = sort_by_map.get(str(sort_by or "").lower(), "s.avg_rating")
    d = str(sort_dir or "").lower()
    direction = "ASC" if d == "asc" else "DESC"
    # By default, crowd (congestion) is nicer when smaller; if caller didn't specify, keep DESC unless explicitly asc.
    sql += f" ORDER BY {col} {direction} NULLS LAST, s.avg_rating DESC NULLS LAST"

    return query(sql, params)

