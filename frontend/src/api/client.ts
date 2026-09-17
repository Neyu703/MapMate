import type {
  GeocodeResult,
  Link,
  Marker,
  MarkerInput,
  Poi,
  Profile,
  ProfileInput,
  TransitJourney,
  WalkRoute,
} from '../types'

const API_BASE = '/api'

async function requestJson<TResponse>(path: string, init?: RequestInit): Promise<TResponse> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!response.ok) {
    throw new Error(`Request to ${path} failed with status ${response.status}`)
  }
  if (response.status === 204) {
    return undefined as TResponse
  }
  return response.json() as Promise<TResponse>
}

export const api = {
  listProfiles: () => requestJson<Profile[]>('/profiles'),
  createProfile: (input: ProfileInput) =>
    requestJson<Profile>('/profiles', { method: 'POST', body: JSON.stringify(input) }),
  updateProfile: (id: number, input: Partial<ProfileInput>) =>
    requestJson<Profile>(`/profiles/${id}`, { method: 'PUT', body: JSON.stringify(input) }),
  deleteProfile: (id: number) => requestJson<void>(`/profiles/${id}`, { method: 'DELETE' }),

  listMarkers: (profileId: number) =>
    requestJson<Marker[]>(`/markers?profile_id=${profileId}`),
  createMarker: (profileId: number, input: MarkerInput) =>
    requestJson<Marker>(`/markers?profile_id=${profileId}`, {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  updateMarker: (id: number, input: Partial<MarkerInput>) =>
    requestJson<Marker>(`/markers/${id}`, { method: 'PUT', body: JSON.stringify(input) }),
  deleteMarker: (id: number) => requestJson<void>(`/markers/${id}`, { method: 'DELETE' }),

  listLinks: (profileId: number) => requestJson<Link[]>(`/links?profile_id=${profileId}`),
  createLink: (markerAId: number, markerBId: number) =>
    requestJson<Link>('/links', {
      method: 'POST',
      body: JSON.stringify({ marker_a_id: markerAId, marker_b_id: markerBId }),
    }),
  deleteLink: (id: number) => requestJson<void>(`/links/${id}`, { method: 'DELETE' }),

  geocode: (query: string, profileId?: number) => {
    const params = new URLSearchParams({ q: query })
    if (profileId !== undefined) {
      params.set('profile_id', String(profileId))
    }
    return requestJson<GeocodeResult[]>(`/geocode?${params}`)
  },

  searchPois: (
    lat: number,
    lon: number,
    radiusMeters: number,
    categories: string[],
    profileId?: number,
  ) => {
    const params = new URLSearchParams({
      lat: String(lat),
      lon: String(lon),
      radius: String(radiusMeters),
      categories: categories.join(','),
    })
    if (profileId !== undefined) {
      params.set('profile_id', String(profileId))
    }
    return requestJson<Poi[]>(`/poi?${params}`)
  },

  routeWalk: (fromLat: number, fromLon: number, toLat: number, toLon: number) =>
    requestJson<WalkRoute>(
      `/route/walk?from_lat=${fromLat}&from_lon=${fromLon}&to_lat=${toLat}&to_lon=${toLon}`,
    ),

  routeTransit: (fromLat: number, fromLon: number, toLat: number, toLon: number) =>
    requestJson<TransitJourney[]>(
      `/route/transit?from_lat=${fromLat}&from_lon=${fromLon}&to_lat=${toLat}&to_lon=${toLon}`,
    ),
}
