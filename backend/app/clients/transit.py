from typing import Optional

import httpx

BASE_URL = "https://v6.db.transport.rest/journeys"


def parse_journeys_response(raw_response: dict) -> list[dict]:
    journeys = []
    for journey in raw_response.get("journeys", []):
        legs = []
        for leg in journey.get("legs", []):
            legs.append(
                {
                    "mode": "walking" if leg.get("walking") else leg.get("line", {}).get("mode", "transit"),
                    "line_name": leg.get("line", {}).get("name") if leg.get("line") else None,
                    "departure": leg.get("departure"),
                    "arrival": leg.get("arrival"),
                    "origin_name": leg.get("origin", {}).get("name"),
                    "destination_name": leg.get("destination", {}).get("name"),
                    "departure_platform": leg.get("departurePlatform"),
                    "arrival_platform": leg.get("arrivalPlatform"),
                }
            )
        journeys.append({"legs": legs})
    return journeys


def get_journeys(
    from_lat: float,
    from_lon: float,
    to_lat: float,
    to_lon: float,
    client: Optional[httpx.Client] = None,
) -> list[dict]:
    params = {
        "from.latitude": from_lat,
        "from.longitude": from_lon,
        "from.address": "Start",
        "to.latitude": to_lat,
        "to.longitude": to_lon,
        "to.address": "Ziel",
        "results": 3,
    }
    owns_client = client is None
    http_client = client or httpx.Client()
    try:
        response = http_client.get(BASE_URL, params=params, timeout=15)
        response.raise_for_status()
        return parse_journeys_response(response.json())
    finally:
        if owns_client:
            http_client.close()
