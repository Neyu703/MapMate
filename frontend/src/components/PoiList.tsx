import { useState } from 'react'
import { getCategoryMeta, type Poi } from '../types'
import styles from './PoiList.module.scss'

interface PoiListProps {
  pois: Poi[]
  onSelect: (poi: Poi) => void
}

interface PoiGroup {
  name: string
  entries: Poi[]
}

function formatDistance(meters: number): string {
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${meters} m`
}

function groupByName(pois: Poi[]): PoiGroup[] {
  const groups = new Map<string, Poi[]>()
  for (const poi of pois) {
    const entries = groups.get(poi.name)
    if (entries) {
      entries.push(poi)
    } else {
      groups.set(poi.name, [poi])
    }
  }
  return Array.from(groups, ([name, entries]) => ({ name, entries }))
}

function closestDistance(entries: Poi[]): number {
  return Math.min(...entries.map((entry) => entry.distance_meters))
}

function PoiRow({ poi, onSelect }: { poi: Poi; onSelect: (poi: Poi) => void }) {
  const categoryMeta = getCategoryMeta(poi.category)
  return (
    <li className={styles.item} onClick={() => onSelect(poi)}>
      <span className={styles.icon} aria-hidden="true">
        {categoryMeta.icon}
      </span>
      <span className={styles.name}>{poi.name}</span>
      <span className={styles.distance}>{formatDistance(poi.distance_meters)}</span>
    </li>
  )
}

function PoiGroupRow({ group, onSelect }: { group: PoiGroup; onSelect: (poi: Poi) => void }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const categoryMeta = getCategoryMeta(group.entries[0]?.category ?? null)

  if (group.entries.length === 1) {
    return <PoiRow poi={group.entries[0]} onSelect={onSelect} />
  }

  return (
    <>
      <li className={styles.groupHeader} onClick={() => setIsExpanded((current) => !current)}>
        <span className={`${styles.chevron} ${isExpanded ? styles.expanded : ''}`} aria-hidden="true">
          ▶
        </span>
        <span className={styles.icon} aria-hidden="true">
          {categoryMeta.icon}
        </span>
        <span className={styles.name}>
          {group.name} <span className={styles.count}>({group.entries.length})</span>
        </span>
        <span className={styles.distance}>{formatDistance(closestDistance(group.entries))}</span>
      </li>
      {isExpanded && (
        <ul className={styles.groupItems}>
          {group.entries
            .slice()
            .sort((a, b) => a.distance_meters - b.distance_meters)
            .map((entry) => (
              <PoiRow key={entry.id} poi={entry} onSelect={onSelect} />
            ))}
        </ul>
      )}
    </>
  )
}

export function PoiList({ pois, onSelect }: PoiListProps) {
  if (pois.length === 0) {
    return null
  }

  const groups = groupByName(pois).sort(
    (a, b) => closestDistance(a.entries) - closestDistance(b.entries),
  )

  return (
    <ul className={styles.list}>
      {groups.map((group) => (
        <PoiGroupRow key={group.name} group={group} onSelect={onSelect} />
      ))}
    </ul>
  )
}
