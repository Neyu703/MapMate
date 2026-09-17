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
          🗑️
        </button>
      )}

      <button
        type="button"
        className={styles.iconButton}
        title="Neues Profil"
        onClick={() => setIsCreating((current) => !current)}
      >
        +
      </button>

      {isCreating && (
        <form className={styles.newProfileForm} onSubmit={handleCreateProfile}>
          <input
            autoFocus
            placeholder="Profilname"
            value={newProfileName}
            onChange={(event) => setNewProfileName(event.target.value)}
          />
          <input
            className={styles.radiusInput}
            type="number"
            min="0"
            placeholder="Radius km (optional)"
            value={newProfileRadiusKm}
            onChange={(event) => setNewProfileRadiusKm(event.target.value)}
          />
          <button type="submit" disabled={createProfile.isPending}>
            Anlegen
          </button>
        </form>
      )}
    </div>
  )
}
