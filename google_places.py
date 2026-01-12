import requests
import urllib.parse
import re
import os
from typing import Optional, Union, List

# 環境変数から取得、なければデフォルト値を使用
GOOGLE_API_KEY = os.environ.get("GOOGLE_MAPS_API_KEY") or "AIzaSyDqIttsqvN2lgNQZmIq-KnfOritHLiMwUI"


def get_place_id_url(maps_url: str) -> Optional[str]:
    """
    Google Maps URLからplace_idを取得
    複数の方法を試行：
    1. URLから直接place_idを抽出（!1s, !3m5!1s パターン）
    2. 座標からPlace Search APIで検索
    3. 場所名からText Search APIで検索
    """
    if not maps_url:
        return None

    # 方法1: URLから直接ChIJ...形式のplace_idを抽出（もしあれば）
    # Google Places APIのplace_idは通常ChIJで始まる
    chij_match = re.search(r'ChIJ[0-9A-Za-z_-]+', maps_url)
    if chij_match:
        return chij_match.group(0)
    
    # 方法2: 場所名からText Search APIで検索（優先）
    # 場所名と座標を組み合わせて検索すると精度が上がる
    place_name_match = re.search(r"/maps/place/([^/@]+)", maps_url)
    coord_match = re.search(r'/place/[^/]+/@([0-9.-]+),([0-9.-]+)', maps_url)
    
    if place_name_match:
        place_name = urllib.parse.unquote(place_name_match.group(1))
        # + をスペースに変換
        place_name = place_name.replace('+', ' ').strip()
        
        if place_name:
            # 座標も取得できた場合は、場所名と座標を組み合わせて検索
            if coord_match:
                try:
                    lat = float(coord_match.group(1))
                    lng = float(coord_match.group(2))
                    # 場所名 + 座標で検索（より正確）
                    query = f"{place_name} {lat},{lng}"
                except (ValueError, Exception):
                    query = place_name
            else:
                query = place_name
            
            url = "https://maps.googleapis.com/maps/api/place/textsearch/json"
            params = {"query": query, "key": GOOGLE_API_KEY}

            try:
                res = requests.get(url, params=params, timeout=10)
                data = res.json()

                if data.get("status") == "OK" and data.get("results"):
                    # 座標がある場合は、最も近い場所を選択
                    if coord_match:
                        try:
                            lat = float(coord_match.group(1))
                            lng = float(coord_match.group(2))
                            # 結果から最も近い場所を選択
                            min_dist = float('inf')
                            best_result = None
                            for result in data["results"]:
                                result_loc = result.get("geometry", {}).get("location", {})
                                result_lat = result_loc.get("lat")
                                result_lng = result_loc.get("lng")
                                if result_lat and result_lng:
                                    # 簡単な距離計算（ハーバーサイン公式の簡易版）
                                    dist = ((result_lat - lat) ** 2 + (result_lng - lng) ** 2) ** 0.5
                                    if dist < min_dist:
                                        min_dist = dist
                                        best_result = result
                            if best_result:
                                return best_result["place_id"]
                        except (ValueError, Exception):
                            pass
                    # 座標がない、または距離計算に失敗した場合は最初の結果を使用
                    return data["results"][0]["place_id"]
            except Exception:
                pass
    
    # 方法3: 座標からPlace Search APIで検索（フォールバック）
    if coord_match:
        try:
            lat = float(coord_match.group(1))
            lng = float(coord_match.group(2))
            
            # 座標からPlace Search APIで検索
            url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
            params = {
                "location": f"{lat},{lng}",
                "radius": 100,  # 100メートル以内
                "key": GOOGLE_API_KEY
            }
            
            res = requests.get(url, params=params, timeout=10)
            data = res.json()
            
            if data.get("status") == "OK" and data.get("results"):
                # 最も近い場所を返す
                return data["results"][0]["place_id"]
        except (ValueError, Exception):
            pass

    return None


def get_shop_photo_url(place_id: str, max_photos: int = 3) -> Union[str, List[str], None]:
    """
    place_idから店舗写真URLを取得
    Args:
        place_id: Google Places APIのplace_id
        max_photos: 取得する最大写真数（デフォルト: 3）
    Returns:
        1枚の場合は文字列、複数枚の場合は文字列のリスト、取得できない場合はNone
    """
    if not place_id:
        return None

    url = "https://maps.googleapis.com/maps/api/place/details/json"
    params = {
        "place_id": place_id,
        "fields": "photos",
        "key": GOOGLE_API_KEY
    }

    res = requests.get(url, params=params, timeout=10)
    data = res.json()

    if data.get("status") != "OK":
        return None

    photos = data["result"].get("photos", [])
    if not photos:
        return None

    # 最大max_photos枚までの写真URLを生成
    photo_urls = []
    for photo in photos[:max_photos]:
        ref = photo["photo_reference"]
        photo_url = (
            "https://maps.googleapis.com/maps/api/place/photo"
            "?maxwidth=800"
            f"&photo_reference={ref}"
            f"&key={GOOGLE_API_KEY}"
        )
        photo_urls.append(photo_url)
    
    # 1枚の場合は文字列、複数枚の場合はリストを返す
    if len(photo_urls) == 1:
        return photo_urls[0]
    return photo_urls


def get_shop_info_from_url(maps_url: str) -> Optional[dict]:
    """
    Google Maps URLから店舗情報を取得（名称、緯度、経度、写真URL）
    Args:
        maps_url: Google Maps URL
    Returns:
        {
            "name": str,
            "latitude": float,
            "longitude": float,
            "photo_urls": list[str]
        } または None
    """
    if not maps_url:
        return None
    
    # 1. place_idを取得
    place_id = get_place_id_url(maps_url)
    if not place_id:
        return None
    
    # 2. Place Details APIで詳細情報を取得
    url = "https://maps.googleapis.com/maps/api/place/details/json"
    params = {
        "place_id": place_id,
        "fields": "name,geometry,photos",
        "key": GOOGLE_API_KEY
    }
    
    try:
        res = requests.get(url, params=params, timeout=10)
        data = res.json()
        
        if data.get("status") != "OK":
            return None
        
        result = data.get("result", {})
        
        # 店舗名
        name = result.get("name", "")
        
        # 座標
        geometry = result.get("geometry", {})
        location = geometry.get("location", {})
        latitude = location.get("lat")
        longitude = location.get("lng")
        
        # 写真URL（最大3枚）
        photos = result.get("photos", [])
        photo_urls = []
        for photo in photos[:3]:
            ref = photo.get("photo_reference")
            if ref:
                photo_url = (
                    "https://maps.googleapis.com/maps/api/place/photo"
                    "?maxwidth=800"
                    f"&photo_reference={ref}"
                    f"&key={GOOGLE_API_KEY}"
                )
                photo_urls.append(photo_url)
        
        return {
            "name": name,
            "latitude": latitude,
            "longitude": longitude,
            "photo_urls": photo_urls
        }
        
    except Exception as e:
        # エラーログは呼び出し側で処理
        raise
        return None



