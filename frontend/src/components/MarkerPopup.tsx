import { useState } from 'react'
import type { MarkerInput } from '../types'
import styles from './MapView.module.scss'

export type FavoriteDetails = Omit<MarkerInput, 'lat' | 'lon'>

interface MarkerPopupProps {
  name: string
  onSaveFavorite: (input: FavoriteDetails) => void
  onRouteWalk: () => void
  onRouteTransit: () => void
  alreadyFavorite: boolean
}

export function MarkerPopup({
  name,
  onSaveFavorite,
  onRouteWalk,
  onRouteTransit,
  alreadyFavorite,
}: MarkerPopupProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [favoriteName, setFavoriteName] = useState(name)
  const [category, setCategory] = useState('')

  const handleSave = (event: React.FormEvent) => {
    event.preventDefault()
    onSaveFavorite({ name: favoriteName.trim() || name, category: category.trim() || null })
    setIsSaving(false)
  }

  return (
    <div className={styles.popupActions}>
      <strong>{name}</strong>

      {!alreadyFavorite &&
        (isSaving ? (
          <form onSubmit={handleSave}>
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
            <button type="submit">Speichern</button>
          </form>
        ) : (
          <button type="button" onClick={() => setIsSaving(true)}>
            Als Favorit speichern
          </button>
        ))}

      <button type="button" onClick={onRouteWalk}>
        Laufweg dorthin
      </button>
      <button type="button" onClick={onRouteTransit}>
        ÖPNV dorthin
      </button>
    </div>
  )
}
