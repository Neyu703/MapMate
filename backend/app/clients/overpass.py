import math
from typing import Optional

import httpx

BASE_URL = "https://overpass-api.de/api/interpreter"

CATEGORY_TAGS = {
    "supermarket": ("shop", "supermarket"),
    "tram_stop": ("railway", "tram_stop"),
    "gym": ("leisure", "fitness_centre"),
    "station": ("railway", "station"),
    "pharmacy": ("amenity", "pharmacy"),
    "doctor": ("amenity", "doctors"),
    "restaurant": ("amenity", "restaurant"),
}


def build_query(
    lat: float, lon: float, radius_meters: float, categories: list[str]
) -> str:
    clauses = []
    for category in categories:
        if category not in CATEGORY_TAGS:
            continue
        key, value = CATEGORY_TAGS[category]
        clauses.append(f'  node["{key}"="{value}"](around:{radius_meters},{lat},{lon});')
    body = "\n".join(clauses)
    return f"[out:json][timeout:25];\n(\n{body}\n);\nout body;"


def haversine_distance_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    earth_radius_meters = 6_371_000
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    a = (
        math.sin(delta_phi / 2) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2) ** 2
    )
    return 2 * earth_radius_meters * math.asin(math.sqrt(a))


def category_for_tags(tags: dict) -> Optional[str]:
    for category, (key, value) in CATEGORY_TAGS.items():
        if tags.get(key) == value:
            return category
    return None


def parse_overpass_response(raw_response: dict, origin_lat: float, origin_lon: float) -> list[dict]:
    pois = []
    for element in raw_response.get("elements", []):
        tags = element.get("tags", {})
        lat, lon = element.get("lat"), element.get("lon")
        if lat is None or lon is None:
            continue
        pois.append(
            {
                "id": element["id"],
                "name": tags.get("name", "(ohne Namen)"),
                "category": category_for_tags(tags),
                "lat": lat,
                "lon": lon,
                "distance_meters": round(haversine_distance_meters(origin_lat, origin_lon, lat, lon)),
            }
        )
    pois.sort(key=lambda poi: poi["distance_meters"])
    return pois


def search_pois(
    lat: float,
    lon: float,
    radius_meters: float,
    categories: list[str],
    client: Optional[httpx.Client] = None,
) -> list[dict]:
    query = build_query(lat, lon, radius_meters, categories)
    owns_client = client is None
    http_client = client or httpx.Client()
    try:
        response = http_client.post(BASE_URL, data={"data": query}, timeout=30)
        response.raise_for_status()
        return parse_overpass_response(response.json(), lat, lon)
    finally:
        if owns_client:
            http_client.close()
