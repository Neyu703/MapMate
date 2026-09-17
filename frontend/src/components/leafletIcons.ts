import L from 'leaflet'
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png'
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import shadowUrl from 'leaflet/dist/images/marker-shadow.png'

// Leaflet's default marker icon URLs break under bundlers (Vite/webpack) because they
// resolve relative to the wrong base path. Repointing them to the bundled assets fixes it.
export function fixLeafletDefaultIcon(): void {
  L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl })
}

const PIN_SIZE = 34

export function createPinIcon(color: string, glyph: string): L.DivIcon {
  return L.divIcon({
    className: '',
    html: `
      <div style="position:relative;width:${PIN_SIZE}px;height:${PIN_SIZE}px;">
        <svg width="${PIN_SIZE}" height="${PIN_SIZE}" viewBox="0 0 34 34" style="position:absolute;top:0;left:0;filter:drop-shadow(0 2px 3px rgba(0,0,0,0.4));">
          <path d="M17 0C8.4 0 1.4 7 1.4 15.6c0 10.4 13.6 17.5 15.1 18.3.3.2.7.2 1 0 1.5-.8 15.1-7.9 15.1-18.3C32.6 7 25.6 0 17 0Z" fill="${color}"/>
        </svg>
        <span style="position:absolute;top:6px;left:0;width:100%;text-align:center;font-size:15px;line-height:1;">${glyph}</span>
      </div>
    `,
    iconSize: [PIN_SIZE, PIN_SIZE],
    iconAnchor: [PIN_SIZE / 2, PIN_SIZE - 2],
    popupAnchor: [0, -PIN_SIZE + 4],
  })
}
