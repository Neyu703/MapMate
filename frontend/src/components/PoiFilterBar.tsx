import { useState } from 'react'
import { POI_CATEGORIES } from '../types'
import styles from './PoiFilterBar.module.scss'

interface PoiFilterBarProps {
  disabled: boolean
  onSearch: (radiusMeters: number, categories: string[]) => void
}

const DEFAULT_RADIUS_METERS = 1000

export function PoiFilterBar({ disabled, onSearch }: PoiFilterBarProps) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [radiusMeters, setRadiusMeters] = useState(DEFAULT_RADIUS_METERS)

  const toggleCategory = (category: string) => {
    setSelectedCategories((current) =>
      current.includes(category)
        ? current.filter((entry) => entry !== category)
        : [...current, category],
    )
  }

  return (
    <div className={styles.bar}>
      {POI_CATEGORIES.map(({ value, label }) => (
        <button
          key={value}
          type="button"
          className={`${styles.chip} ${selectedCategories.includes(value) ? styles.active : ''}`}
          onClick={() => toggleCategory(value)}
        >
          {label}
        </button>
      ))}

      <label className={styles.radiusLabel}>
        Umkreis: {radiusMeters} m
        <input
          type="range"
          min={200}
          max={5000}
          step={100}
          value={radiusMeters}
          onChange={(event) => setRadiusMeters(Number(event.target.value))}
        />
      </label>

      <button
        type="button"
        disabled={disabled || selectedCategories.length === 0}
        onClick={() => onSearch(radiusMeters, selectedCategories)}
      >
        Suchen
      </button>
    </div>
  )
}
