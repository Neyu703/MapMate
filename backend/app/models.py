from typing import Optional

from pydantic import BaseModel, Field


class ProfileCreate(BaseModel):
    name: str
    center_lat: Optional[float] = None
    center_lon: Optional[float] = None
    radius_km: Optional[float] = Field(default=None, gt=0)


class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    center_lat: Optional[float] = None
    center_lon: Optional[float] = None
    radius_km: Optional[float] = Field(default=None, gt=0)


class Profile(BaseModel):
    id: int
    name: str
    center_lat: Optional[float]
    center_lon: Optional[float]
    radius_km: Optional[float]
    is_default: bool
    created_at: str


class MarkerCreate(BaseModel):
    name: str
    lat: float
    lon: float
    category: Optional[str] = None
    color: str = "#3388ff"
    note: Optional[str] = None


class MarkerUpdate(BaseModel):
    name: Optional[str] = None
    lat: Optional[float] = None
    lon: Optional[float] = None
    category: Optional[str] = None
    color: Optional[str] = None
    note: Optional[str] = None


class Marker(BaseModel):
    id: int
    profile_id: int
    name: str
    lat: float
    lon: float
    category: Optional[str]
    color: str
    note: Optional[str]
    created_at: str


class LinkCreate(BaseModel):
    marker_a_id: int
    marker_b_id: int


class Link(BaseModel):
    id: int
    profile_id: int
    marker_a_id: int
    marker_b_id: int
    created_at: str
