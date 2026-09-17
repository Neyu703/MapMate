import { useMutation } from '@tanstack/react-query'
import { api } from '../api/client'

interface TransitLinesSearchParams {
  lat: number
  lon: number
  radiusMeters: number
}

export function useTransitLinesSearch() {
  return useMutation({
    mutationFn: ({ lat, lon, radiusMeters }: TransitLinesSearchParams) =>
      api.searchTransitLines(lat, lon, radiusMeters),
  })
}
