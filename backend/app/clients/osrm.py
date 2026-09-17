from typing import Optional

import httpx

BASE_URL = "https://router.project-osrm.org/route/v1/foot"


def parse_route_response(raw_response: dict) -> dict:
    if raw_response.get("code") != "Ok" or not raw_response.get("routes"):
        raise ValueError(f"OSRM returned no route: {raw_response.get('code')}")
    route = raw_response["routes"][0]
    return {
        "distance_meters": route["distance"],
        "duration_seconds": route["duration"],
        "geometry": route["geometry"]["coordinates"],
    }


def get_walking_route(
    from_lat: float,
    from_lon: float,
    to_lat: float,
    to_lon: float,
    client: Optional[httpx.Client] = None,
) -> dict:
    coordinates = f"{from_lon},{from_lat};{to_lon},{to_lat}"
    url = f"{BASE_URL}/{coordinates}"
    params = {"overview": "full", "geometries": "geojson"}

    owns_client = client is None
    http_client = client or httpx.Client()
    try:
        response = http_client.get(url, params=params, timeout=15)
        response.raise_for_status()
        return parse_route_response(response.json())
    finally:
        if owns_client:
            http_client.close()
