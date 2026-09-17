import { useEffect } from 'react'
import L from 'leaflet'
import {
  MapContainer,
  Marker,
  Polygon,
  Polyline,
  Popup,
  TileLayer,
  Tooltip,
  ZoomControl,
  useMap,
  useMapEvents,
} from 'react-leaflet'
import type { LinkRouteGeometry } from '../hooks/useLinkRoutes'
import { buildCircleLatLngs, WORLD_COVERING_RING } from '../lib/geo'
import {
  getCategoryMeta,
  type Link,
  type Marker as FavoriteMarker,
  type Poi,
  type TransitLine,
} from '../types'
import { createPinIcon, fixLeafletDefaultIcon } from './leafletIcons'
import { MarkerPopup, type FavoriteDetails, type PlaceDetails } from './MarkerPopup'
import styles from './MapView.module.scss'

fixLeafletDefaultIcon()

const DEFAULT_CENTER: [number, number] = [51.48, 11.97]
const DEFAULT_ZOOM = 14
const PENDING_POINT_COLOR = '#ea4335'

export interface RouteTarget {
  lat: number
  lon: number
  name: string
}

export interface ProfileRadiusMask {
  centerLat: number
  centerLon: number
  radiusKm: number
}

interface MapViewProps {
  flyToCenter: [number, number] | null
  favorites: FavoriteMarker[]
  pois: Poi[]
  transitLines: TransitLine[]
  radiusMask: ProfileRadiusMask | null
  links: Link[]
  showGraph: boolean
  linkRoutes: Map<number, LinkRouteGeometry>
  pendingPoint: RouteTarget | null
  onMapClick: (lat: number, lon: number) => void
  onSaveFavorite: (point: RouteTarget, input: FavoriteDetails) => void
  onRouteWalk: (target: RouteTarget) => void
  onRouteTransit: (target: RouteTarget) => void
  onLinkClick: (markerA: FavoriteMarker, markerB: FavoriteMarker) => void
}

function FlyToCenter({ center }: { center: [number, number] | null }) {
  const map = useMap()
  useEffect(() => {
    if (center) {
      map.flyTo(center, DEFAULT_ZOOM)
    }
  }, [center, map])
  return null
}

function ClickHandler({ onMapClick }: { onMapClick: (lat: number, lon: number) => void }) {
  useMapEvents({
    click: (event) => onMapClick(event.latlng.lat, event.latlng.lng),
  })
  return null
}

function findFavoriteById(favorites: FavoriteMarker[], id: number) {
  return favorites.find((favorite) => favorite.id === id)
}

function isSameLocation(a: { lat: number; lon: number }, b: { lat: number; lon: number }): boolean {
  return a.lat === b.lat && a.lon === b.lon
}

// Without this, clicking a marker to open its popup also bubbles up as a map
// click, which would overwrite pendingPoint/searchCenter with the click coordinates.
const stopClickBubblingToMap = {
  click: (event: L.LeafletMouseEvent) => L.DomEvent.stopPropagation(event.originalEvent),
}

export function MapView({
  flyToCenter,
  favorites,
  pois,
  transitLines,
  radiusMask,
  links,
  showGraph,
  linkRoutes,
  pendingPoint,
  onMapClick,
  onSaveFavorite,
  onRouteWalk,
  onRouteTransit,
  onLinkClick,
}: MapViewProps) {
  return (
    <MapContainer
      className={styles.mapContainer}
      center={DEFAULT_CENTER}
      zoom={DEFAULT_ZOOM}
      zoomControl={false}
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ZoomControl position="bottomright" />
      <FlyToCenter center={flyToCenter} />
      <ClickHandler onMapClick={onMapClick} />

      {radiusMask && (
        <Polygon
          positions={[
            WORLD_COVERING_RING,
            buildCircleLatLngs(radiusMask.centerLat, radiusMask.centerLon, radiusMask.radiusKm),
          ]}
          interactive={false}
          pathOptions={{
            stroke: true,
            color: '#5f6368',
            weight: 1.5,
            fillColor: '#202124',
            fillOpacity: 0.35,
          }}
        />
      )}

      {transitLines.map((line) =>
        line.segments.map((segment, segmentIndex) => (
          <Polyline
            key={`transit-line-${line.id}-${segmentIndex}`}
            positions={segment}
            pathOptions={{ color: line.color, weight: 4, opacity: 0.8 }}
          >
            <Tooltip sticky>
              Linie {line.ref}
              {line.name ? ` · ${line.name}` : ''}
            </Tooltip>
          </Polyline>
        )),
      )}

      {favorites.map((favorite) => {
        const categoryMeta = getCategoryMeta(favorite.category)
        const place: PlaceDetails = {
          name: favorite.name,
          category: favorite.category,
          lat: favorite.lat,
          lon: favorite.lon,
        }
        return (
          <Marker
            key={`favorite-${favorite.id}`}
            position={[favorite.lat, favorite.lon]}
            icon={createPinIcon(favorite.color, categoryMeta.icon)}
            eventHandlers={stopClickBubblingToMap}
          >
            <Popup maxWidth={280} minWidth={240}>
              <MarkerPopup
                place={place}
                alreadyFavorite
                onSaveFavorite={() => {}}
                onRouteWalk={() => onRouteWalk({ lat: favorite.lat, lon: favorite.lon, name: favorite.name })}
                onRouteTransit={() =>
                  onRouteTransit({ lat: favorite.lat, lon: favorite.lon, name: favorite.name })
                }
              />
            </Popup>
          </Marker>
        )
      })}

      {pois.map((poi) => {
        const categoryMeta = getCategoryMeta(poi.category)
        const place: PlaceDetails = {
          name: poi.name,
          category: poi.category,
          lat: poi.lat,
          lon: poi.lon,
          distanceMeters: poi.distance_meters,
          openingHours: poi.opening_hours,
          phone: poi.phone,
          website: poi.website,
          address: poi.address,
          platform: poi.platform,
        }
        return (
          <Marker
            key={`poi-${poi.id}`}
            position={[poi.lat, poi.lon]}
            icon={createPinIcon(categoryMeta.color, categoryMeta.icon)}
            eventHandlers={stopClickBubblingToMap}
          >
            <Popup maxWidth={280} minWidth={240}>
              <MarkerPopup
                place={place}
                alreadyFavorite={favorites.some((favorite) => isSameLocation(favorite, poi))}
                onSaveFavorite={(input) => onSaveFavorite({ lat: poi.lat, lon: poi.lon, name: poi.name }, input)}
                onRouteWalk={() => onRouteWalk({ lat: poi.lat, lon: poi.lon, name: poi.name })}
                onRouteTransit={() => onRouteTransit({ lat: poi.lat, lon: poi.lon, name: poi.name })}
              />
            </Popup>
          </Marker>
        )
      })}

      {pendingPoint && (
        <Marker
          position={[pendingPoint.lat, pendingPoint.lon]}
          icon={createPinIcon(PENDING_POINT_COLOR, '📍')}
          eventHandlers={stopClickBubblingToMap}
        >
          <Popup maxWidth={280} minWidth={240}>
            <MarkerPopup
              place={{ name: pendingPoint.name, lat: pendingPoint.lat, lon: pendingPoint.lon }}
              alreadyFavorite={favorites.some((favorite) => isSameLocation(favorite, pendingPoint))}
              onSaveFavorite={(input) => onSaveFavorite(pendingPoint, input)}
              onRouteWalk={() => onRouteWalk(pendingPoint)}
              onRouteTransit={() => onRouteTransit(pendingPoint)}
            />
          </Popup>
        </Marker>
      )}

      {showGraph &&
        links.map((link) => {
          const markerA = findFavoriteById(favorites, link.marker_a_id)
          const markerB = findFavoriteById(favorites, link.marker_b_id)
          if (!markerA || !markerB) {
            return null
          }
          const routeGeometry = linkRoutes.get(link.id)
          const positions: [number, number][] = routeGeometry ?? [
            [markerA.lat, markerA.lon],
            [markerB.lat, markerB.lon],
          ]
          return (
            <Polyline
              key={`link-${link.id}-${routeGeometry ? 'route' : 'fallback'}`}
              positions={positions}
              pathOptions={
                routeGeometry
                  ? { color: '#1a73e8', weight: 4, opacity: 0.85 }
                  : { color: '#1a73e8', dashArray: '6 6', weight: 3 }
              }
              eventHandlers={{
                click: (event) => {
                  L.DomEvent.stopPropagation(event.originalEvent)
                  onLinkClick(markerA, markerB)
                },
              }}
            />
          )
        })}
    </MapContainer>
  )
}
