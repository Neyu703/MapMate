import type { Marker } from '../types'
import styles from './FavoritesPanel.module.scss'

interface FavoritesPanelProps {
  favorites: Marker[]
  onDelete: (id: number) => void
  onSelect: (favorite: Marker) => void
}

export function FavoritesPanel({ favorites, onDelete, onSelect }: FavoritesPanelProps) {
  if (favorites.length === 0) {
    return <div className={styles.panel}>Noch keine Favoriten in diesem Profil.</div>
  }

  return (
    <div className={styles.panel}>
      {favorites.map((favorite) => (
        <div key={favorite.id} className={styles.item}>
          <button type="button" className={styles.nameButton} onClick={() => onSelect(favorite)}>
            <span
              className={styles.colorDot}
              style={{ '--dot-color': favorite.color } as React.CSSProperties}
            />
            {favorite.name}
            {favorite.category ? ` (${favorite.category})` : ''}
          </button>
          <button type="button" onClick={() => onDelete(favorite.id)}>
            Entfernen
          </button>
        </div>
      ))}
    </div>
  )
}
