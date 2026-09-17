import { TRANSIT_MODE_LABELS, type TransitLine, type TransitMode } from '../types'
import styles from './TransitLinesLegend.module.scss'

interface TransitLinesLegendProps {
  lines: TransitLine[]
  enabledModes: Set<TransitMode>
  hiddenLineRefs: Set<string>
  onToggleMode: (mode: TransitMode) => void
  onToggleLine: (ref: string) => void
}

function uniqueByRef(lines: TransitLine[]): TransitLine[] {
  const seenRefs = new Set<string>()
  const unique: TransitLine[] = []
  for (const line of lines) {
    if (!seenRefs.has(line.ref)) {
      seenRefs.add(line.ref)
      unique.push(line)
    }
  }
  return unique
}

const ALL_MODES: TransitMode[] = ['tram', 'bus', 'bahn']

export function TransitLinesLegend({
  lines,
  enabledModes,
  hiddenLineRefs,
  onToggleMode,
  onToggleLine,
}: TransitLinesLegendProps) {
  if (lines.length === 0) {
    return null
  }

  const visibleModes = new Set(lines.map((line) => line.mode))

  return (
    <div className={styles.wrapper}>
      <div className={styles.modeRow}>
        {ALL_MODES.filter((mode) => visibleModes.has(mode)).map((mode) => (
          <button
            key={mode}
            type="button"
            className={`${styles.modeChip} ${enabledModes.has(mode) ? styles.active : ''}`}
            onClick={() => onToggleMode(mode)}
          >
            {TRANSIT_MODE_LABELS[mode]}
          </button>
        ))}
      </div>

      <div className={styles.lineRow}>
        {uniqueByRef(lines)
          .filter((line) => enabledModes.has(line.mode))
          .map((line) => (
            <button
              key={line.ref}
              type="button"
              className={`${styles.chip} ${hiddenLineRefs.has(line.ref) ? styles.hidden : ''}`}
              onClick={() => onToggleLine(line.ref)}
            >
              <span className={styles.swatch} style={{ '--swatch-color': line.color } as React.CSSProperties} />
              Linie {line.ref}
            </button>
          ))}
      </div>
    </div>
  )
}
