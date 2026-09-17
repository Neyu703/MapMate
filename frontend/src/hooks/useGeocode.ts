import { useMutation } from '@tanstack/react-query'
import { api } from '../api/client'

export function useGeocode() {
  return useMutation({
    mutationFn: ({ query, profileId }: { query: string; profileId?: number }) =>
      api.geocode(query, profileId),
  })
}
