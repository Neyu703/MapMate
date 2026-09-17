import zlib
from typing import Optional

import httpx

BASE_URL = "https://overpass-api.de/api/interpreter"
USER_AGENT = "MapMate/0.1 (personal desktop app, local use only)"
ROUTE_TYPES = ("bus", "tram", "light_rail", "train", "subway")

# Groups OSM's finer-grained route types into the three modes the UI lets the
# user filter by (S-Bahn/ICE and U-Bahn both count as "Bahn" here).
MODE_BY_ROUTE_TYPE = {
    "bus": "bus",
    "tram": "tram",
    "light_rail": "tram",
    "train": "bahn",
    "subway": "bahn",
}

# Deterministic fallback palette for lines whose OSM relation has no colour tag
# (common for bus routes), so different line refs still look visually distinct.
FALLBACK_COLORS = [
    "#e6194b", "#3cb44b", "#ffe119", "#4363d8", "#f58231",
    "#911eb4", "#46f0f0", "#f032e6", "#bcf60c", "#fabebe",
]


def fallback_color_for_ref(ref: str) -> str:
    # zlib.crc32 instead of the builtin hash(): Python randomizes str hashing per
    # process (PYTHONHASHSEED), which would reshuffle every line's color on each restart.
    stable_hash = zlib.crc32(ref.encode("utf-8"))
    return FALLBACK_COLORS[stable_hash % len(FALLBACK_COLORS)]


def build_query(lat: float, lon: float, radius_meters: float) -> str:
    route_filter = "|".join(ROUTE_TYPES)
    return (
        f'[out:json][timeout:25];\n'
        f'(\n'
        f'  relation(around:{radius_meters},{lat},{lon})["route"~"^({route_filter})$"];\n'
        f');\n'
        f'out geom;'
    )


def parse_transit_lines_response(raw_response: dict) -> list[dict]:
    lines = []
    for element in raw_response.get("elements", []):
        if element.get("type") != "relation":
            continue
        tags = element.get("tags", {})
        segments = []
        for member in element.get("members", []):
            geometry = member.get("geometry")
            if geometry:
                segments.append([[point["lat"], point["lon"]] for point in geometry])
        if not segments:
            continue

        line_ref = tags.get("ref", "?")
        route_type = tags.get("route")
        lines.append(
            {
                "id": element["id"],
                "ref": line_ref,
                "name": tags.get("name"),
                "route_type": route_type,
                "mode": MODE_BY_ROUTE_TYPE.get(route_type, "bus"),
                "color": tags.get("colour") or fallback_color_for_ref(line_ref),
                "segments": segments,
            }
        )
    return lines


def search_transit_lines(
    lat: float,
    lon: float,
    radius_meters: float,
    client: Optional[httpx.Client] = None,
) -> list[dict]:
    query = build_query(lat, lon, radius_meters)
    owns_client = client is None
    http_client = client or httpx.Client()
    try:
        response = http_client.post(
            BASE_URL, data={"data": query}, headers={"User-Agent": USER_AGENT}, timeout=30
        )
        response.raise_for_status()
        return parse_transit_lines_response(response.json())
    finally:
        if owns_client:
            http_client.close()
