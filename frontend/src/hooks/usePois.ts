import { useMutation } from '@tanstack/react-query'
import { api } from '../api/client'

interface PoiSearchParams {
  lat: number
  lon: number
  radiusMeters: number
  categories: string[]
  profileId?: number
}

export function usePoiSearch() {
  return useMutation({
    mutationFn: ({ lat, lon, radiusMeters, categories, profileId }: PoiSearchParams) =>
      api.searchPois(lat, lon, radiusMeters, categories, profileId),
  })
}
