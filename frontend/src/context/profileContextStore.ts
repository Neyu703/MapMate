import { createContext, useContext } from 'react'
import type { Profile } from '../types'

export interface ProfileContextValue {
  profiles: Profile[]
  activeProfile: Profile | null
  setActiveProfileId: (id: number) => void
  isLoading: boolean
}

export const ProfileContext = createContext<ProfileContextValue | null>(null)

export function useProfileContext(): ProfileContextValue {
  const context = useContext(ProfileContext)
  if (!context) {
    throw new Error('useProfileContext must be used within a ProfileProvider')
  }
  return context
}
