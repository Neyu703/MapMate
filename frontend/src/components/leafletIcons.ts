import L from 'leaflet'
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png'
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import shadowUrl from 'leaflet/dist/images/marker-shadow.png'

// Leaflet's default marker icon URLs break under bundlers (Vite/webpack) because they
// resolve relative to the wrong base path. Repointing them to the bundled assets fixes it.
export function fixLeafletDefaultIcon(): void {
  L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl })
}

export function createColoredIcon(color: string): L.DivIcon {
  return L.divIcon({
    className: '',
    html: `<span style="display:block;width:14px;height:14px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 0 2px rgba(0,0,0,0.6);"></span>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  })
}
