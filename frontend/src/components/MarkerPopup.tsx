import { useState } from 'react'
import { buildGoogleMapsUrl } from '../lib/googleMaps'
import { getCategoryMeta, type MarkerInput } from '../types'
import styles from './MarkerPopup.module.scss'

export type FavoriteDetails = Omit<MarkerInput, 'lat' | 'lon'>

export interface PlaceDetails {
  name: string
  category?: string | null
  lat: number
  lon: number
  distanceMeters?: number
  openingHours?: string | null
  phone?: string | null
  website?: string | null
  address?: string | null
}

interface MarkerPopupProps {
  place: PlaceDetails
  onSaveFavorite: (input: FavoriteDetails) => void
  onRouteWalk: () => void
  onRouteTransit: () => void
  alreadyFavorite: boolean
}

function formatDistance(meters: number): string {
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${meters} m`
}

export function MarkerPopup({
  place,
  onSaveFavorite,
  onRouteWalk,
  onRouteTransit,
  alreadyFavorite,
}: MarkerPopupProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [favoriteName, setFavoriteName] = useState(place.name)
  const [category, setCategory] = useState('')
  const categoryMeta = getCategoryMeta(place.category ?? null)

  const handleSave = (event: React.FormEvent) => {
    event.preventDefault()
    onSaveFavorite({ name: favoriteName.trim() || place.name, category: category.trim() || null })
    setIsSaving(false)
  }

  return (
    <div className={styles.card}>
      <div className={styles.banner} style={{ '--banner-color': categoryMeta.color } as React.CSSProperties}>
        <span className={styles.bannerIcon} aria-hidden="true">
          {categoryMeta.icon}
        </span>
      </div>

      <div className={styles.body}>
        <h3 className={styles.title}>{place.name}</h3>
        <div className={styles.subtitle}>
          {categoryMeta.label}
          {place.distanceMeters !== undefined && ` · ${formatDistance(place.distanceMeters)}`}
        </div>

        <dl className={styles.details}>
          {place.openingHours && (
            <div className={styles.detailRow}>
              <dt>🕒</dt>
              <dd>{place.openingHours}</dd>
            </div>
          )}
          {place.address && (
            <div className={styles.detailRow}>
              <dt>📍</dt>
              <dd>{place.address}</dd>
            </div>
          )}
          {place.phone && (
            <div className={styles.detailRow}>
              <dt>📞</dt>
              <dd>{place.phone}</dd>
            </div>
          )}
          {place.website && (
            <div className={styles.detailRow}>
              <dt>🔗</dt>
              <dd>
                <a href={place.website} target="_blank" rel="noopener noreferrer">
                  {place.website}
                </a>
              </dd>
            </div>
          )}
        </dl>

        <a
          className={styles.googleMapsLink}
          href={buildGoogleMapsUrl(place.name, place.lat, place.lon, place.address)}
          target="_blank"
          rel="noopener noreferrer"
        >
          In Google Maps öffnen ↗
        </a>

        <div className={styles.actions}>
          {!alreadyFavorite &&
            (isSaving ? (
              <form className={styles.saveForm} onSubmit={handleSave}>
                <input
                  autoFocus
                  value={favoriteName}
                  onChange={(event) => setFavoriteName(event.target.value)}
                  placeholder="Name"
                />
                <input
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  placeholder="Kategorie (z.B. workplace-partner)"
                />
                <button type="submit" className={styles.primaryButton}>
                  Speichern
                </button>
              </form>
            ) : (
              <button type="button" className={styles.secondaryButton} onClick={() => setIsSaving(true)}>
                ⭐ Als Favorit speichern
              </button>
            ))}

          <div className={styles.routeButtons}>
            <button type="button" className={styles.secondaryButton} onClick={onRouteWalk}>
              🚶 Laufweg
            </button>
            <button type="button" className={styles.secondaryButton} onClick={onRouteTransit}>
              🚋 ÖPNV
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
