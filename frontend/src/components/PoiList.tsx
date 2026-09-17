import { getCategoryMeta, type Poi } from '../types'
import styles from './PoiList.module.scss'

interface PoiListProps {
  pois: Poi[]
  onSelect: (poi: Poi) => void
}

function formatDistance(meters: number): string {
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${meters} m`
}

export function PoiList({ pois, onSelect }: PoiListProps) {
  if (pois.length === 0) {
    return null
  }

  return (
    <ul className={styles.list}>
      {pois.map((poi) => {
        const categoryMeta = getCategoryMeta(poi.category)
        return (
          <li key={poi.id} className={styles.item} onClick={() => onSelect(poi)}>
            <span className={styles.icon} aria-hidden="true">
              {categoryMeta.icon}
            </span>
            <span className={styles.name}>{poi.name}</span>
            <span className={styles.distance}>{formatDistance(poi.distance_meters)}</span>
          </li>
        )
      })}
    </ul>
  )
}
