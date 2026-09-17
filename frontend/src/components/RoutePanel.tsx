import type { TransitJourney, WalkRoute } from '../types'
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

export function RoutePanel({ result, onClose }: RoutePanelProps) {
  return (
    <div className={styles.panel}>
      <button type="button" className={styles.closeButton} onClick={onClose}>
        Schließen
      </button>
      <h3>Route zu {result.targetName}</h3>

      {result.kind === 'loading' && <p>Route wird berechnet...</p>}

      {result.kind === 'error' && <p>{result.message}</p>}

      {result.kind === 'walk' && (
        <p>
          Laufweg: {formatDistance(result.route.distance_meters)},{' '}
          {formatDuration(result.route.duration_seconds)}
        </p>
      )}

      {result.kind === 'transit' &&
        (result.journeys.length === 0 ? (
          <p>Keine ÖPNV-Verbindung gefunden.</p>
        ) : (
          result.journeys.map((journey, journeyIndex) => (
            <div key={journeyIndex}>
              {journey.legs.map((leg, legIndex) => (
                <div key={legIndex} className={styles.leg}>
                  {leg.mode === 'walking' ? (
                    <span>Zu Fuß: {leg.origin_name} → {leg.destination_name}</span>
                  ) : (
                    <span>
                      {leg.line_name ?? leg.mode}: {leg.origin_name} ({leg.departure}) →{' '}
                      {leg.destination_name} ({leg.arrival})
                    </span>
                  )}
                </div>
              ))}
            </div>
          ))
        ))}
    </div>
  )
}
