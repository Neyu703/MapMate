export interface Profile {
  id: number
  name: string
  center_lat: number | null
  center_lon: number | null
  radius_km: number | null
  is_default: boolean
  created_at: string
}

export interface ProfileInput {
  name: string
  center_lat?: number | null
  center_lon?: number | null
  radius_km?: number | null
}

export interface Marker {
  id: number
  profile_id: number
  name: string
  lat: number
  lon: number
  category: string | null
  color: string
  note: string | null
  created_at: string
}

export interface MarkerInput {
  name: string
  lat: number
  lon: number
  category?: string | null
  color?: string
  note?: string | null
}

export interface Link {
  id: number
  profile_id: number
  marker_a_id: number
  marker_b_id: number
  created_at: string
}

export interface GeocodeResult {
  display_name: string
  lat: number
  lon: number
}

export interface Poi {
  id: number
  name: string
  category: string | null
  lat: number
  lon: number
  distance_meters: number
  opening_hours: string | null
  phone: string | null
  website: string | null
  address: string | null
}

export interface WalkRoute {
  distance_meters: number
  duration_seconds: number
  geometry: [number, number][]
}

export interface TransitLeg {
  mode: string
  line_name: string | null
  departure: string | null
  arrival: string | null
  origin_name: string | null
  destination_name: string | null
}

export interface TransitJourney {
  legs: TransitLeg[]
}

export type TransitMode = 'bus' | 'tram' | 'bahn'

export interface TransitLine {
  id: number
  ref: string
  name: string | null
  route_type: string | null
  mode: TransitMode
  color: string
  segments: [number, number][][]
}

export const TRANSIT_MODE_LABELS: Record<TransitMode, string> = {
  bus: 'Bus',
  tram: 'Tram',
  bahn: 'Bahn',
}

export interface CategoryMeta {
  value: string
  label: string
  icon: string
  color: string
}

export const POI_CATEGORIES: CategoryMeta[] = [
  { value: 'supermarket', label: 'Supermarkt', icon: '🛒', color: '#1a73e8' },
  { value: 'tram_stop', label: 'Tram-/Bus-Haltestelle', icon: '🚊', color: '#188038' },
  { value: 'gym', label: 'Fitnessstudio', icon: '🏋️', color: '#e37400' },
  { value: 'station', label: 'Bahnhof', icon: '🚉', color: '#8430ce' },
  { value: 'pharmacy', label: 'Apotheke', icon: '💊', color: '#d93025' },
  { value: 'doctor', label: 'Arzt', icon: '🩺', color: '#12b5cb' },
  { value: 'restaurant', label: 'Restaurant', icon: '🍽️', color: '#b06000' },
]

const DEFAULT_CATEGORY_META: CategoryMeta = {
  value: 'other',
  label: 'Ort',
  icon: '📍',
  color: '#5f6368',
}

export function getCategoryMeta(category: string | null): CategoryMeta {
  return POI_CATEGORIES.find((meta) => meta.value === category) ?? DEFAULT_CATEGORY_META
}
