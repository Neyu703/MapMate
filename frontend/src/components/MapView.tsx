import { useEffect } from 'react'
import L from 'leaflet'
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import type { Link, Marker as FavoriteMarker, Poi } from '../types'
import { createColoredIcon, fixLeafletDefaultIcon } from './leafletIcons'
import { MarkerPopup, type FavoriteDetails } from './MarkerPopup'
import styles from './MapView.module.scss'

fixLeafletDefaultIcon()

const DEFAULT_CENTER: [number, number] = [51.48, 11.97]
const DEFAULT_ZOOM = 14

export interface RouteTarget {
  lat: number
  lon: number
  name: string
}

interface MapViewProps {
  flyToCenter: [number, number] | null
  favorites: FavoriteMarker[]
  pois: Poi[]
  links: Link[]
  showGraph: boolean
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

// Without this, clicking a marker to open its popup also bubbles up as a map
// click, which would overwrite pendingPoint/searchCenter with the click coordinates.
const stopClickBubblingToMap = {
  click: (event: L.LeafletMouseEvent) => L.DomEvent.stopPropagation(event.originalEvent),
}

export function MapView({
  flyToCenter,
  favorites,
  pois,
  links,
  showGraph,
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
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FlyToCenter center={flyToCenter} />
      <ClickHandler onMapClick={onMapClick} />

      {favorites.map((favorite) => (
        <Marker
          key={`favorite-${favorite.id}`}
          position={[favorite.lat, favorite.lon]}
          icon={createColoredIcon(favorite.color)}
          eventHandlers={stopClickBubblingToMap}
        >
          <Popup>
            <MarkerPopup
              name={favorite.name}
              alreadyFavorite
              onSaveFavorite={() => {}}
              onRouteWalk={() => onRouteWalk({ lat: favorite.lat, lon: favorite.lon, name: favorite.name })}
              onRouteTransit={() =>
                onRouteTransit({ lat: favorite.lat, lon: favorite.lon, name: favorite.name })
              }
            />
          </Popup>
        </Marker>
      ))}

      {pois.map((poi) => (
        <Marker
          key={`poi-${poi.id}`}
          position={[poi.lat, poi.lon]}
          eventHandlers={stopClickBubblingToMap}
        >
          <Popup>
            <MarkerPopup
              name={poi.name}
              alreadyFavorite={favorites.some((favorite) => favorite.lat === poi.lat && favorite.lon === poi.lon)}
              onSaveFavorite={(input) => onSaveFavorite({ lat: poi.lat, lon: poi.lon, name: poi.name }, input)}
              onRouteWalk={() => onRouteWalk({ lat: poi.lat, lon: poi.lon, name: poi.name })}
              onRouteTransit={() => onRouteTransit({ lat: poi.lat, lon: poi.lon, name: poi.name })}
            />
          </Popup>
        </Marker>
      ))}

      {pendingPoint && (
        <Marker
          position={[pendingPoint.lat, pendingPoint.lon]}
          eventHandlers={stopClickBubblingToMap}
        >
          <Popup>
            <MarkerPopup
              name={pendingPoint.name}
              alreadyFavorite={favorites.some(
                (favorite) => favorite.lat === pendingPoint.lat && favorite.lon === pendingPoint.lon,
              )}
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
          return (
            <Polyline
              key={`link-${link.id}`}
              positions={[
                [markerA.lat, markerA.lon],
                [markerB.lat, markerB.lon],
              ]}
              pathOptions={{ color: '#3388ff', dashArray: '6 6' }}
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
