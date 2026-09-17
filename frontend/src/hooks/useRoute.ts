import { useMutation } from '@tanstack/react-query'
import { api } from '../api/client'

interface RouteEndpoints {
  fromLat: number
  fromLon: number
  toLat: number
  toLon: number
}

export function useWalkRoute() {
  return useMutation({
    mutationFn: ({ fromLat, fromLon, toLat, toLon }: RouteEndpoints) =>
      api.routeWalk(fromLat, fromLon, toLat, toLon),
  })
}

export function useTransitRoute() {
  return useMutation({
    mutationFn: ({ fromLat, fromLon, toLat, toLon }: RouteEndpoints) =>
      api.routeTransit(fromLat, fromLon, toLat, toLon),
  })
}
