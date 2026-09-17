import { useState } from 'react'
import { getCategoryMeta, type Link, type Marker } from '../types'
import styles from './FavoritesCard.module.scss'

interface FavoritesCardProps {
  favorites: Marker[]
  links: Link[]
  showGraph: boolean
  onToggleShowGraph: () => void
  onCreateLink: (markerAId: number, markerBId: number) => void
  onDeleteLink: (id: number) => void
  onDeleteFavorite: (id: number) => void
  onSelectFavorite: (favorite: Marker) => void
}

function favoriteName(favorites: Marker[], id: number): string {
  return favorites.find((favorite) => favorite.id === id)?.name ?? `#${id}`
}

export function FavoritesCard({
  favorites,
  links,
  showGraph,
  onToggleShowGraph,
  onCreateLink,
  onDeleteLink,
  onDeleteFavorite,
  onSelectFavorite,
}: FavoritesCardProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [markerAId, setMarkerAId] = useState<number | ''>('')
  const [markerBId, setMarkerBId] = useState<number | ''>('')

  const handleCreateLink = (event: React.FormEvent) => {
    event.preventDefault()
    if (markerAId !== '' && markerBId !== '' && markerAId !== markerBId) {
      onCreateLink(Number(markerAId), Number(markerBId))
      setMarkerAId('')
      setMarkerBId('')
    }
  }

  return (
    <div>
      <div className={styles.header} onClick={() => setIsExpanded((current) => !current)}>
        <span className={styles.headerTitle}>
          <span className={`${styles.chevron} ${isExpanded ? styles.expanded : ''}`} aria-hidden="true">
            ▶
          </span>
          Favoriten
        </span>
        <button
          type="button"
          className={`${styles.graphToggle} ${showGraph ? styles.active : ''}`}
          onClick={(event) => {
            event.stopPropagation()
            onToggleShowGraph()
          }}
        >
          🗺️ Graph-Modus
        </button>
      </div>

      {isExpanded && (
        <div className={styles.body}>
          {favorites.length >= 2 && (
            <form className={styles.linkForm} onSubmit={handleCreateLink}>
              <select value={markerAId} onChange={(event) => setMarkerAId(Number(event.target.value))}>
                <option value="">Favorit A</option>
                {favorites.map((favorite) => (
                  <option key={favorite.id} value={favorite.id}>
                    {favorite.name}
                  </option>
                ))}
              </select>
              <select value={markerBId} onChange={(event) => setMarkerBId(Number(event.target.value))}>
                <option value="">Favorit B</option>
                {favorites.map((favorite) => (
                  <option key={favorite.id} value={favorite.id}>
                    {favorite.name}
                  </option>
                ))}
              </select>
              <button type="submit">Verknüpfen</button>
            </form>
          )}

          {links.length > 0 &&
            links.map((link) => (
              <div key={link.id} className={styles.linkRow}>
                <span>
                  {favoriteName(favorites, link.marker_a_id)} ↔ {favoriteName(favorites, link.marker_b_id)}
                </span>
                <button type="button" className={styles.unlinkButton} onClick={() => onDeleteLink(link.id)}>
                  Trennen
                </button>
              </div>
            ))}

          {(favorites.length >= 2 || links.length > 0) && <hr className={styles.divider} />}

          {favorites.length === 0 ? (
            <div className={styles.empty}>Noch keine Favoriten in diesem Profil.</div>
          ) : (
            <div className={styles.favoritesList}>
              {favorites.map((favorite) => {
                const categoryMeta = getCategoryMeta(favorite.category)
                return (
                  <div key={favorite.id} className={styles.favoriteItem}>
                    <button
                      type="button"
                      className={styles.nameButton}
                      onClick={() => onSelectFavorite(favorite)}
                    >
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
                      onClick={() => onDeleteFavorite(favorite.id)}
                    >
                      ✕
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
