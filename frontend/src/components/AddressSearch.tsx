import { useState } from 'react'
import { useProfileContext } from '../context/profileContextStore'
import { useGeocode } from '../hooks/useGeocode'
import type { GeocodeResult } from '../types'
import styles from './AddressSearch.module.scss'

interface AddressSearchProps {
  onAddressSelected: (result: GeocodeResult) => void
}

export function AddressSearch({ onAddressSelected }: AddressSearchProps) {
  const { activeProfile } = useProfileContext()
  const geocode = useGeocode()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<GeocodeResult[]>([])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!query.trim()) {
      return
    }
    const found = await geocode.mutateAsync({ query: query.trim(), profileId: activeProfile?.id })
    setResults(found)
  }

  const handleSelect = (result: GeocodeResult) => {
    onAddressSelected(result)
    setQuery(result.display_name)
    setResults([])
  }

  return (
    <div className={styles.wrapper}>
      <form onSubmit={handleSubmit}>
        <input
          className={styles.input}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Adresse suchen..."
        />
      </form>
      {results.length > 0 && (
        <ul className={styles.results}>
          {results.map((result) => (
            <li
              key={`${result.lat}-${result.lon}`}
              className={styles.resultItem}
              onClick={() => handleSelect(result)}
            >
              {result.display_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
