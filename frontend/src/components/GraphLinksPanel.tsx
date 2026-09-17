import { useState } from 'react'
import type { Link, Marker } from '../types'
import styles from './GraphLinksPanel.module.scss'

interface GraphLinksPanelProps {
  favorites: Marker[]
  links: Link[]
  showGraph: boolean
  onToggleShowGraph: () => void
  onCreateLink: (markerAId: number, markerBId: number) => void
  onDeleteLink: (id: number) => void
}

function favoriteName(favorites: Marker[], id: number): string {
  return favorites.find((favorite) => favorite.id === id)?.name ?? `#${id}`
}

export function GraphLinksPanel({
  favorites,
  links,
  showGraph,
  onToggleShowGraph,
  onCreateLink,
  onDeleteLink,
}: GraphLinksPanelProps) {
  const [markerAId, setMarkerAId] = useState<number | ''>('')
  const [markerBId, setMarkerBId] = useState<number | ''>('')

  const handleCreate = (event: React.FormEvent) => {
    event.preventDefault()
    if (markerAId !== '' && markerBId !== '' && markerAId !== markerBId) {
      onCreateLink(Number(markerAId), Number(markerBId))
      setMarkerAId('')
      setMarkerBId('')
    }
  }

  return (
    <div className={styles.panel}>
      <label className={styles.toggleLabel}>
        <input type="checkbox" checked={showGraph} onChange={onToggleShowGraph} />
        Graph-Modus
      </label>

      {links.map((link) => (
        <div key={link.id} className={styles.linkRow}>
          <span>
            {favoriteName(favorites, link.marker_a_id)} ↔ {favoriteName(favorites, link.marker_b_id)}
          </span>
          <button type="button" className={styles.unlinkButton} onClick={() => onDeleteLink(link.id)}>
            Trennen
          </button>
        </div>
      ))}

      <form className={styles.newLinkForm} onSubmit={handleCreate}>
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
    </div>
  )
}
