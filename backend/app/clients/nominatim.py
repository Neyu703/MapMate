import math
from typing import Optional

import httpx

BASE_URL = "https://nominatim.openstreetmap.org/search"
USER_AGENT = "MapMate/0.1 (personal desktop app, local use only)"
RESULT_LIMIT = 8


def build_viewbox(
    center_lat: float, center_lon: float, radius_km: float
) -> tuple[float, float, float, float]:
    lat_delta = radius_km / 111.32
    lon_scale = max(0.01, abs(math.cos(math.radians(center_lat))))
    lon_delta = radius_km / (111.32 * lon_scale)
    left = center_lon - lon_delta
    top = center_lat + lat_delta
    right = center_lon + lon_delta
    bottom = center_lat - lat_delta
    return left, top, right, bottom


def parse_search_response(raw_results: list[dict]) -> list[dict]:
    return [
        {
            "display_name": item["display_name"],
            "lat": float(item["lat"]),
            "lon": float(item["lon"]),
        }
        for item in raw_results
    ]


def search_address(
    query: str,
    center_lat: Optional[float] = None,
    center_lon: Optional[float] = None,
    radius_km: Optional[float] = None,
    client: Optional[httpx.Client] = None,
) -> list[dict]:
    params = {
        "q": query,
        "format": "jsonv2",
        "addressdetails": 1,
        "limit": RESULT_LIMIT,
    }
    if center_lat is not None and center_lon is not None and radius_km:
        left, top, right, bottom = build_viewbox(center_lat, center_lon, radius_km)
        params["viewbox"] = f"{left},{top},{right},{bottom}"
        params["bounded"] = 1

    owns_client = client is None
    http_client = client or httpx.Client()
    try:
        response = http_client.get(
            BASE_URL, params=params, headers={"User-Agent": USER_AGENT}, timeout=10
        )
        response.raise_for_status()
        return parse_search_response(response.json())
    finally:
        if owns_client:
            http_client.close()
