import { useEffect, useRef, useState } from 'react'
import { api } from '../api/client'
import type { Link, Marker } from '../types'

export type LinkRouteGeometry = [number, number][]

function findFavoriteById(favorites: Marker[], id: number): Marker | undefined {
  return favorites.find((favorite) => favorite.id === id)
}

function toLeafletPositions(geoJsonCoordinates: [number, number][]): LinkRouteGeometry {
  return geoJsonCoordinates.map(([lon, lat]) => [lat, lon])
}

// Fetches the real walking-route geometry for each graph link (instead of a straight
// line between the two favorites) once graph mode is active, and caches it by link id.
export function useLinkRoutes(
  links: Link[],
  favorites: Marker[],
  enabled: boolean,
): Map<number, LinkRouteGeometry> {
  const [routesByLinkId, setRoutesByLinkId] = useState<Map<number, LinkRouteGeometry>>(new Map())
  const requestedLinkIds = useRef(new Set<number>())

  useEffect(() => {
    if (!enabled) {
      return
    }

    for (const link of links) {
      if (requestedLinkIds.current.has(link.id)) {
        continue
      }
      const markerA = findFavoriteById(favorites, link.marker_a_id)
      const markerB = findFavoriteById(favorites, link.marker_b_id)
      if (!markerA || !markerB) {
        continue
      }
      requestedLinkIds.current.add(link.id)

      api
        .routeWalk(markerA.lat, markerA.lon, markerB.lat, markerB.lon)
        .then((route) => {
          setRoutesByLinkId((current) => {
            const next = new Map(current)
            next.set(link.id, toLeafletPositions(route.geometry))
            return next
          })
        })
        .catch(() => {
          // Leave this link without a cached route; MapView falls back to a straight line.
        })
    }
  }, [links, favorites, enabled])

  return routesByLinkId
}
