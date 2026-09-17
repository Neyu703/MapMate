import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { AddressSearch } from './components/AddressSearch'
import { FavoritesPanel } from './components/FavoritesPanel'
import { GraphLinksPanel } from './components/GraphLinksPanel'
import { MapView, type RouteTarget } from './components/MapView'
import type { FavoriteDetails } from './components/MarkerPopup'
import { PoiFilterBar } from './components/PoiFilterBar'
import { PoiList } from './components/PoiList'
import { RoutePanel, type RouteResult } from './components/RoutePanel'
import { ProfileProvider } from './context/ProfileContext'
import { useProfileContext } from './context/profileContextStore'
import { useCreateLink, useDeleteLink, useLinks } from './hooks/useLinks'
import { useCreateMarker, useDeleteMarker, useMarkers } from './hooks/useMarkers'
import { usePoiSearch } from './hooks/usePois'
import { useTransitRoute, useWalkRoute } from './hooks/useRoute'
import { ProfileSwitcher } from './components/ProfileSwitcher'
import type { GeocodeResult, Marker as FavoriteMarker, Poi } from './types'
import styles from './App.module.scss'

const queryClient = new QueryClient()

function MapMateApp() {
  const { activeProfile } = useProfileContext()
  const profileId = activeProfile?.id

  const { data: favorites = [] } = useMarkers(profileId ?? -1)
  const { data: links = [] } = useLinks(profileId ?? -1)
  const createMarker = useCreateMarker(profileId ?? -1)
  const deleteMarker = useDeleteMarker(profileId ?? -1)
  const createLink = useCreateLink(profileId ?? -1)
  const deleteLink = useDeleteLink(profileId ?? -1)
  const poiSearch = usePoiSearch()
  const walkRoute = useWalkRoute()
  const transitRoute = useTransitRoute()

  const [searchCenter, setSearchCenter] = useState<[number, number] | null>(null)
  const [flyToCenter, setFlyToCenter] = useState<[number, number] | null>(null)
  const [pois, setPois] = useState<Poi[]>([])
  const [pendingPoint, setPendingPoint] = useState<RouteTarget | null>(null)
  const [showGraph, setShowGraph] = useState(false)
  const [routeResult, setRouteResult] = useState<RouteResult | null>(null)

  const handleAddressSelected = (result: GeocodeResult) => {
    const center: [number, number] = [result.lat, result.lon]
    setSearchCenter(center)
    setFlyToCenter(center)
    setPendingPoint({ lat: result.lat, lon: result.lon, name: result.display_name })
  }

  const handleMapClick = (lat: number, lon: number) => {
    setSearchCenter([lat, lon])
    setPendingPoint({ lat, lon, name: `Punkt ${lat.toFixed(5)}, ${lon.toFixed(5)}` })
  }

  const handlePoiSearch = async (radiusMeters: number, categories: string[]) => {
    if (!searchCenter) {
      return
    }
    const [lat, lon] = searchCenter
    const found = await poiSearch.mutateAsync({ lat, lon, radiusMeters, categories, profileId })
    setPois(found)
  }

  const handleSelectPoi = (poi: Poi) => {
    setFlyToCenter([poi.lat, poi.lon])
  }

  const handleSaveFavorite = (point: RouteTarget, input: FavoriteDetails) => {
    createMarker.mutate({ ...input, name: input.name || point.name, lat: point.lat, lon: point.lon })
  }

  const computeWalkRoute = async (from: [number, number], target: RouteTarget) => {
    setRouteResult({ kind: 'loading', targetName: target.name })
    const [fromLat, fromLon] = from
    try {
      const route = await walkRoute.mutateAsync({ fromLat, fromLon, toLat: target.lat, toLon: target.lon })
      setRouteResult({ kind: 'walk', targetName: target.name, route })
    } catch {
      setRouteResult({ kind: 'error', targetName: target.name, message: 'Laufweg konnte nicht berechnet werden.' })
    }
  }

  const computeTransitRoute = async (from: [number, number], target: RouteTarget) => {
    setRouteResult({ kind: 'loading', targetName: target.name })
    const [fromLat, fromLon] = from
    try {
      const journeys = await transitRoute.mutateAsync({
        fromLat,
        fromLon,
        toLat: target.lat,
        toLon: target.lon,
      })
      setRouteResult({ kind: 'transit', targetName: target.name, journeys })
    } catch {
      setRouteResult({
        kind: 'error',
        targetName: target.name,
        message: 'ÖPNV-Verbindung konnte nicht berechnet werden.',
      })
    }
  }

  const handleRouteWalk = (target: RouteTarget) => {
    if (searchCenter) {
      computeWalkRoute(searchCenter, target)
    }
  }

  const handleRouteTransit = (target: RouteTarget) => {
    if (searchCenter) {
      computeTransitRoute(searchCenter, target)
    }
  }

  const handleLinkClick = (markerA: FavoriteMarker, markerB: FavoriteMarker) => {
    computeWalkRoute([markerA.lat, markerA.lon], { lat: markerB.lat, lon: markerB.lon, name: markerB.name })
  }

  return (
    <div className={styles.appShell}>
      <ProfileSwitcher />
      <div className={styles.body}>
        <aside className={styles.sidebar}>
          <AddressSearch onAddressSelected={handleAddressSelected} />
          <PoiFilterBar disabled={!searchCenter} onSearch={handlePoiSearch} />
          <PoiList pois={pois} onSelect={handleSelectPoi} />
          <FavoritesPanel
            favorites={favorites}
            onDelete={(id) => deleteMarker.mutate(id)}
            onSelect={(favorite) => setFlyToCenter([favorite.lat, favorite.lon])}
          />
          <GraphLinksPanel
            favorites={favorites}
            links={links}
            showGraph={showGraph}
            onToggleShowGraph={() => setShowGraph((current) => !current)}
            onCreateLink={(markerAId, markerBId) => createLink.mutate({ markerAId, markerBId })}
            onDeleteLink={(id) => deleteLink.mutate(id)}
          />
          {routeResult && <RoutePanel result={routeResult} onClose={() => setRouteResult(null)} />}
        </aside>
        <MapView
          flyToCenter={flyToCenter}
          favorites={favorites}
          pois={pois}
          links={links}
          showGraph={showGraph}
          pendingPoint={pendingPoint}
          onMapClick={handleMapClick}
          onSaveFavorite={handleSaveFavorite}
          onRouteWalk={handleRouteWalk}
          onRouteTransit={handleRouteTransit}
          onLinkClick={handleLinkClick}
        />
      </div>
    </div>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ProfileProvider>
        <MapMateApp />
      </ProfileProvider>
    </QueryClientProvider>
  )
}

export default App
