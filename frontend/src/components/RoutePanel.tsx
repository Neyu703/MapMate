import type { TransitJourney, TransitLeg, WalkRoute } from '../types'
import styles from './RoutePanel.module.scss'

export type RouteResult =
  | { kind: 'loading'; targetName: string }
  | { kind: 'error'; targetName: string; message: string }
  | { kind: 'walk'; targetName: string; route: WalkRoute }
  | { kind: 'transit'; targetName: string; journeys: TransitJourney[] }

interface RoutePanelProps {
  result: RouteResult
  onClose: () => void
}

function formatDuration(seconds: number): string {
  const minutes = Math.round(seconds / 60)
  return `${minutes} Min.`
}

function formatDistance(meters: number): string {
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${Math.round(meters)} m`
}

function formatTime(isoTimestamp: string | null): string {
  if (!isoTimestamp) {
    return '--:--'
  }
  const parsed = new Date(isoTimestamp)
  if (Number.isNaN(parsed.getTime())) {
    return '--:--'
  }
  return parsed.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
}

function journeySpan(journey: TransitJourney): { departure: string | null; arrival: string | null } {
  const firstLeg = journey.legs[0]
  const lastLeg = journey.legs[journey.legs.length - 1]
  return {
    departure: firstLeg?.departure ?? null,
    arrival: lastLeg?.arrival ?? null,
  }
}

function journeyDurationMinutes(journey: TransitJourney): number | null {
  const { departure, arrival } = journeySpan(journey)
  if (!departure || !arrival) {
    return null
  }
  const departureTime = new Date(departure).getTime()
  const arrivalTime = new Date(arrival).getTime()
  if (Number.isNaN(departureTime) || Number.isNaN(arrivalTime)) {
    return null
  }
  return Math.round((arrivalTime - departureTime) / 60000)
}

function TransitLegRow({ leg }: { leg: TransitLeg }) {
  if (leg.mode === 'walking') {
    return (
      <div className={styles.leg}>
        🚶 Zu Fuß: {leg.origin_name} → {leg.destination_name}
      </div>
    )
  }

  return (
    <div className={styles.leg}>
      <div className={styles.legLine}>
        🚋 {leg.line_name ?? leg.mode}
      </div>
      <div className={styles.legStop}>
        {formatTime(leg.departure)} {leg.origin_name}
        {leg.departure_platform ? ` (Steig ${leg.departure_platform})` : ''}
      </div>
      <div className={styles.legStop}>
        {formatTime(leg.arrival)} {leg.destination_name}
        {leg.arrival_platform ? ` (Steig ${leg.arrival_platform})` : ''}
      </div>
    </div>
  )
}

function JourneyOption({ journey, optionNumber }: { journey: TransitJourney; optionNumber: number }) {
  const { departure, arrival } = journeySpan(journey)
  const durationMinutes = journeyDurationMinutes(journey)

  return (
    <div className={styles.journey}>
      <div className={styles.journeyHeader}>
        <span>Option {optionNumber}</span>
        <span>
          {formatTime(departure)} → {formatTime(arrival)}
          {durationMinutes !== null && ` · ${durationMinutes} Min.`}
        </span>
      </div>
      {journey.legs.map((leg, legIndex) => (
        <TransitLegRow key={legIndex} leg={leg} />
      ))}
    </div>
  )
}

export function RoutePanel({ result, onClose }: RoutePanelProps) {
  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h3 className={styles.title}>Route zu {result.targetName}</h3>
        <button type="button" className={styles.closeButton} onClick={onClose} title="Schließen">
          ✕
        </button>
      </div>

      {result.kind === 'loading' && <p className={styles.summary}>Route wird berechnet...</p>}

      {result.kind === 'error' && <p className={styles.summary}>{result.message}</p>}

      {result.kind === 'walk' && (
        <p className={styles.summary}>
          🚶 {formatDistance(result.route.distance_meters)} · {formatDuration(result.route.duration_seconds)}
        </p>
      )}

      {result.kind === 'transit' &&
        (result.journeys.length === 0 ? (
          <p className={styles.summary}>Keine ÖPNV-Verbindung gefunden.</p>
        ) : (
          result.journeys.map((journey, journeyIndex) => (
            <JourneyOption key={journeyIndex} journey={journey} optionNumber={journeyIndex + 1} />
          ))
        ))}
    </div>
  )
}
