import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'

function linksQueryKey(profileId: number) {
  return ['links', profileId]
}

export function useLinks(profileId: number) {
  return useQuery({
    queryKey: linksQueryKey(profileId),
    queryFn: () => api.listLinks(profileId),
  })
}

export function useCreateLink(profileId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ markerAId, markerBId }: { markerAId: number; markerBId: number }) =>
      api.createLink(markerAId, markerBId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: linksQueryKey(profileId) }),
  })
}

export function useDeleteLink(profileId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.deleteLink(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: linksQueryKey(profileId) }),
  })
}
