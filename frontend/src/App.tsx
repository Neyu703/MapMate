import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { AddressSearch } from './components/AddressSearch'
import { FavoritesCard } from './components/FavoritesCard'
import { MapView, type ProfileRadiusMask, type RouteTarget } from './components/MapView'
import type { FavoriteDetails } from './components/MarkerPopup'
import { PoiFilterBar } from './components/PoiFilterBar'
import { PoiList } from './components/PoiList'
import { RoutePanel, type RouteResult } from './components/RoutePanel'
import { TransitLinesLegend } from './components/TransitLinesLegend'
import { ProfileProvider } from './context/ProfileContext'
import { useProfileContext } from './context/profileContextStore'
import { useCreateLink, useDeleteLink, useLinks } from './hooks/useLinks'
import { useLinkRoutes } from './hooks/useLinkRoutes'
import { useCreateMarker, useDeleteMarker, useMarkers } from './hooks/useMarkers'
import { usePoiSearch } from './hooks/usePois'
import { useTransitRoute, useWalkRoute } from './hooks/useRoute'
import { useTransitLinesSearch } from './hooks/useTransitLines'
import { ProfileSwitcher } from './components/ProfileSwitcher'
import type { GeocodeResult, Marker as FavoriteMarker, Poi, TransitLine, TransitMode } from './types'
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
  const [showGraph, setShowGraph] = useState(false)
  const linkRoutes = useLinkRoutes(links, favorites, showGraph)

  const [searchCenter, setSearchCenter] = useState<[number, number] | null>(null)
  const [flyToCenter, setFlyToCenter] = useState<[number, number] | null>(null)
  const [pois, setPois] = useState<Poi[]>([])
  const [transitLines, setTransitLines] = useState<TransitLine[]>([])
  const [enabledTransitModes, setEnabledTransitModes] = useState<Set<TransitMode>>(
    new Set(['tram', 'bus', 'bahn']),
  )
  const [hiddenLineRefs, setHiddenLineRefs] = useState<Set<string>>(new Set())
  const [poiError, setPoiError] = useState<string | null>(null)
  const transitLinesSearch = useTransitLinesSearch()
  const [pendingPoint, setPendingPoint] = useState<RouteTarget | null>(null)
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
    try {
      const found = await poiSearch.mutateAsync({ lat, lon, radiusMeters, categories, profileId })
      setPoiError(null)
      setPois(found)
    } catch {
      setPoiError('Orte konnten nicht geladen werden. Bitte gleich nochmal versuchen.')
    }

    if (categories.includes('tram_stop')) {
      try {
        const lines = await transitLinesSearch.mutateAsync({ lat, lon, radiusMeters })
        setTransitLines(lines)
      } catch {
        setTransitLines([])
      }
    } else {
      setTransitLines([])
    }
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
    computeTransitRoute([markerA.lat, markerA.lon], { lat: markerB.lat, lon: markerB.lon, name: markerB.name })
  }

  const handleToggleTransitMode = (mode: TransitMode) => {
    setEnabledTransitModes((current) => {
      const next = new Set(current)
      if (next.has(mode)) {
        next.delete(mode)
      } else {
        next.add(mode)
      }
      return next
    })
  }

  const handleToggleLineVisibility = (ref: string) => {
    setHiddenLineRefs((current) => {
      const next = new Set(current)
      if (next.has(ref)) {
        next.delete(ref)
      } else {
        next.add(ref)
      }
      return next
    })
  }

  const visibleTransitLines = transitLines.filter(
    (line) => enabledTransitModes.has(line.mode) && !hiddenLineRefs.has(line.ref),
  )

  const radiusMask: ProfileRadiusMask | null =
    activeProfile?.center_lat != null && activeProfile?.center_lon != null && activeProfile?.radius_km != null
      ? {
          centerLat: activeProfile.center_lat,
          centerLon: activeProfile.center_lon,
          radiusKm: activeProfile.radius_km,
        }
      : null

  return (
    <div className={styles.appShell}>
      <div className={styles.mapArea}>
        <MapView
          flyToCenter={flyToCenter}
          favorites={favorites}
          pois={pois}
          transitLines={visibleTransitLines}
          radiusMask={radiusMask}
          links={links}
          showGraph={showGraph}
          linkRoutes={linkRoutes}
          pendingPoint={pendingPoint}
          onMapClick={handleMapClick}
          onSaveFavorite={handleSaveFavorite}
          onRouteWalk={handleRouteWalk}
          onRouteTransit={handleRouteTransit}
          onLinkClick={handleLinkClick}
        />

        <AddressSearch onAddressSelected={handleAddressSelected} />
        <PoiFilterBar disabled={!searchCenter} error={poiError} onSearch={handlePoiSearch} />
        <ProfileSwitcher />

        <div className={styles.floatingPanel}>
          {transitLines.length > 0 && (
            <div className={styles.panelCard}>
              <TransitLinesLegend
                lines={transitLines}
                enabledModes={enabledTransitModes}
                hiddenLineRefs={hiddenLineRefs}
                onToggleMode={handleToggleTransitMode}
                onToggleLine={handleToggleLineVisibility}
              />
            </div>
          )}

          {pois.length > 0 && (
            <div className={styles.panelCard}>
              <PoiList pois={pois} onSelect={handleSelectPoi} />
            </div>
          )}

          {routeResult && (
            <div className={styles.panelCard}>
              <RoutePanel result={routeResult} onClose={() => setRouteResult(null)} />
            </div>
          )}

          <div className={styles.panelCard}>
            <FavoritesCard
              favorites={favorites}
              links={links}
              showGraph={showGraph}
              onToggleShowGraph={() => setShowGraph((current) => !current)}
              onCreateLink={(markerAId, markerBId) => createLink.mutate({ markerAId, markerBId })}
              onDeleteLink={(id) => deleteLink.mutate(id)}
              onDeleteFavorite={(id) => deleteMarker.mutate(id)}
              onSelectFavorite={(favorite) => setFlyToCenter([favorite.lat, favorite.lon])}
            />
          </div>
        </div>
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
