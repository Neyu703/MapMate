import { getCategoryMeta, type Marker } from '../types'
import styles from './FavoritesPanel.module.scss'

interface FavoritesPanelProps {
  favorites: Marker[]
  onDelete: (id: number) => void
  onSelect: (favorite: Marker) => void
}

export function FavoritesPanel({ favorites, onDelete, onSelect }: FavoritesPanelProps) {
  return (
    <div className={styles.panel}>
      <h3 className={styles.heading}>Favoriten</h3>
      {favorites.length === 0 ? (
        <div className={styles.empty}>Noch keine Favoriten in diesem Profil.</div>
      ) : (
        favorites.map((favorite) => {
          const categoryMeta = getCategoryMeta(favorite.category)
          return (
            <div key={favorite.id} className={styles.item}>
              <button type="button" className={styles.nameButton} onClick={() => onSelect(favorite)}>
                <span
                  className={styles.colorDot}
                  style={{ '--dot-color': favorite.color } as React.CSSProperties}
                />
                {favorite.category ? `${categoryMeta.icon} ` : ''}
                {favorite.name}
              </button>
              <button
                type="button"
                className={styles.removeButton}
                title="Entfernen"
                onClick={() => onDelete(favorite.id)}
              >
                ✕
              </button>
            </div>
          )
        })
      )}
    </div>
  )
}
