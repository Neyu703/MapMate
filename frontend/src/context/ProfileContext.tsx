import { useMemo, useState, type ReactNode } from 'react'
import { useProfiles } from '../hooks/useProfiles'
import { ProfileContext } from './profileContextStore'

const ACTIVE_PROFILE_STORAGE_KEY = 'mapmate.activeProfileId'

function readStoredProfileId(): number | null {
  try {
    const stored = window.localStorage.getItem(ACTIVE_PROFILE_STORAGE_KEY)
    return stored ? Number(stored) : null
  } catch {
    return null
  }
}

function storeProfileId(id: number): void {
  try {
    window.localStorage.setItem(ACTIVE_PROFILE_STORAGE_KEY, String(id))
  } catch {
    // localStorage unavailable (private browsing, etc.) — active profile just won't persist.
  }
}

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { data: profiles = [], isLoading } = useProfiles()
  const [storedProfileId, setStoredProfileId] = useState<number | null>(readStoredProfileId)

  // Falls back to the first profile (e.g. the always-present default one) until the
  // user explicitly picks one, without needing an effect to "correct" the state.
  const activeProfile = useMemo(() => {
    const byStoredId = profiles.find((profile) => profile.id === storedProfileId)
    return byStoredId ?? profiles[0] ?? null
  }, [profiles, storedProfileId])

  const setActiveProfileId = (id: number) => {
    setStoredProfileId(id)
    storeProfileId(id)
  }

  return (
    <ProfileContext.Provider value={{ profiles, activeProfile, setActiveProfileId, isLoading }}>
      {children}
    </ProfileContext.Provider>
  )
}
