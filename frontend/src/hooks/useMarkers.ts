import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'
import type { MarkerInput } from '../types'

function markersQueryKey(profileId: number) {
  return ['markers', profileId]
}

export function useMarkers(profileId: number) {
  return useQuery({
    queryKey: markersQueryKey(profileId),
    queryFn: () => api.listMarkers(profileId),
  })
}

export function useCreateMarker(profileId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: MarkerInput) => api.createMarker(profileId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: markersQueryKey(profileId) }),
  })
}

export function useDeleteMarker(profileId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.deleteMarker(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: markersQueryKey(profileId) }),
  })
}
