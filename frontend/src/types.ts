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

export const POI_CATEGORIES = [
  { value: 'supermarket', label: 'Supermarkt' },
  { value: 'tram_stop', label: 'Tram-/Bus-Haltestelle' },
  { value: 'gym', label: 'Fitnessstudio' },
  { value: 'station', label: 'Bahnhof' },
  { value: 'pharmacy', label: 'Apotheke' },
  { value: 'doctor', label: 'Arzt' },
  { value: 'restaurant', label: 'Restaurant' },
] as const
