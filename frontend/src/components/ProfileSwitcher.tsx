import { useState } from 'react'
import { useProfileContext } from '../context/profileContextStore'
import { useCreateProfile, useDeleteProfile } from '../hooks/useProfiles'
import styles from './ProfileSwitcher.module.scss'

export function ProfileSwitcher() {
  const { profiles, activeProfile, setActiveProfileId } = useProfileContext()
  const createProfile = useCreateProfile()
  const deleteProfile = useDeleteProfile()
  const [isCreating, setIsCreating] = useState(false)
  const [newProfileName, setNewProfileName] = useState('')
  const [newProfileRadiusKm, setNewProfileRadiusKm] = useState('')

  const handleCreateProfile = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!newProfileName.trim()) {
      return
    }
    const created = await createProfile.mutateAsync({
      name: newProfileName.trim(),
      radius_km: newProfileRadiusKm ? Number(newProfileRadiusKm) : null,
    })
    setActiveProfileId(created.id)
    setNewProfileName('')
    setNewProfileRadiusKm('')
    setIsCreating(false)
  }

  const handleDeleteActiveProfile = () => {
    if (!activeProfile) {
      return
    }
    const confirmed = window.confirm(
      `Profil "${activeProfile.name}" inklusive aller Favoriten und Verknüpfungen löschen?`,
    )
    if (confirmed) {
      deleteProfile.mutate(activeProfile.id)
    }
  }

  return (
    <div className={styles.bar}>
      <select
        className={styles.select}
        value={activeProfile?.id ?? ''}
        onChange={(event) => setActiveProfileId(Number(event.target.value))}
      >
        {profiles.map((profile) => (
          <option key={profile.id} value={profile.id}>
            {profile.name}
            {profile.radius_km ? ` (${profile.radius_km} km)` : ''}
          </option>
        ))}
      </select>

      {activeProfile && !activeProfile.is_default && (
        <button
          type="button"
          className={styles.iconButton}
          title="Profil löschen"
          onClick={handleDeleteActiveProfile}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M4 7h16M9 7V4h6v3m-8 0 1 13h8l1-13"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}

      <button
        type="button"
        className={styles.iconButton}
        title="Neues Profil"
        onClick={() => setIsCreating((current) => !current)}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      {isCreating && (
        <form className={styles.newProfileForm} onSubmit={handleCreateProfile}>
          <label className={styles.field}>
            Profilname
            <input
              autoFocus
              value={newProfileName}
              onChange={(event) => setNewProfileName(event.target.value)}
              placeholder="z.B. Halle (Saale)"
            />
          </label>
          <label className={styles.field}>
            Umkreis in km (optional)
            <input
              type="number"
              min="0"
              value={newProfileRadiusKm}
              onChange={(event) => setNewProfileRadiusKm(event.target.value)}
              placeholder="unbegrenzt"
            />
          </label>
          <button type="submit" className={styles.submitButton} disabled={createProfile.isPending}>
            Profil anlegen
          </button>
        </form>
      )}
    </div>
  )
}
