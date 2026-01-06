import requests
import urllib.parse
import re
import os

GOOGLE_API_KEY = os.environ.get("GOOGLE_MAPS_API_KEY")


def get_place_id_url(maps_url: str) -> str | None:
    if not maps_url:
        return None

    match = re.search(r"/maps/place/([^/]+)/", maps_url)
    if not match:
        return None

    place_name = urllib.parse.unquote(match.group(1))

    url = "https://maps.googleapis.com/maps/api/place/textsearch/json"
    params = {"query": place_name, "key": GOOGLE_API_KEY}

    res = requests.get(url, params=params, timeout=10)
    data = res.json()

    if data.get("status") != "OK":
        return None

    return data["results"][0]["place_id"]


def get_shop_photo_url(place_id: str) -> str | None:
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

    ref = photos[0]["photo_reference"]
    return (
        "https://maps.googleapis.com/maps/api/place/photo"
        "?maxwidth=800"
        f"&photo_reference={ref}"
        f"&key={GOOGLE_API_KEY}"
    )



