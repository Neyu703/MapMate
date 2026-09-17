import { useState } from 'react'
import { POI_CATEGORIES } from '../types'
import styles from './PoiFilterBar.module.scss'

interface PoiFilterBarProps {
  disabled: boolean
  error: string | null
  onSearch: (radiusMeters: number, categories: string[]) => void
}

const DEFAULT_RADIUS_METERS = 1000

export function PoiFilterBar({ disabled, error, onSearch }: PoiFilterBarProps) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [radiusMeters, setRadiusMeters] = useState(DEFAULT_RADIUS_METERS)

  const toggleCategory = (category: string) => {
    const next = selectedCategories.includes(category)
      ? selectedCategories.filter((entry) => entry !== category)
      : [...selectedCategories, category]
    setSelectedCategories(next)
    if (!disabled && next.length > 0) {
      onSearch(radiusMeters, next)
    }
  }

  const handleRadiusChange = (value: number) => {
    setRadiusMeters(value)
    if (!disabled && selectedCategories.length > 0) {
      onSearch(value, selectedCategories)
    }
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.chipRow}>
        {POI_CATEGORIES.map(({ value, label, icon }) => (
          <button
            key={value}
            type="button"
            disabled={disabled}
            className={`${styles.chip} ${selectedCategories.includes(value) ? styles.active : ''}`}
            onClick={() => toggleCategory(value)}
          >
            <span aria-hidden="true">{icon}</span> {label}
          </button>
        ))}
      </div>

      {error && <div className={styles.errorBanner}>{error}</div>}

      {selectedCategories.length > 0 && (
        <label className={styles.radiusLabel}>
          Umkreis: {radiusMeters >= 1000 ? `${(radiusMeters / 1000).toFixed(1)} km` : `${radiusMeters} m`}
          <input
            type="range"
            min={200}
            max={5000}
            step={100}
            value={radiusMeters}
            onChange={(event) => handleRadiusChange(Number(event.target.value))}
          />
        </label>
      )}
    </div>
  )
}
