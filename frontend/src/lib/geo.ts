const EARTH_RADIUS_KM = 6371
const CIRCLE_POINT_COUNT = 72

// Approximates a circle of the given radius around a center point as a polygon ring,
// accounting for longitude degrees shrinking away from the equator.
export function buildCircleLatLngs(
  centerLat: number,
  centerLon: number,
  radiusKm: number,
): [number, number][] {
  const points: [number, number][] = []
  const angularRadius = radiusKm / EARTH_RADIUS_KM
  const centerLatRad = (centerLat * Math.PI) / 180

  for (let index = 0; index <= CIRCLE_POINT_COUNT; index += 1) {
    const bearing = (index / CIRCLE_POINT_COUNT) * 2 * Math.PI
    const pointLatRad = Math.asin(
      Math.sin(centerLatRad) * Math.cos(angularRadius) +
        Math.cos(centerLatRad) * Math.sin(angularRadius) * Math.cos(bearing),
    )
    const pointLonRad =
      (centerLon * Math.PI) / 180 +
      Math.atan2(
        Math.sin(bearing) * Math.sin(angularRadius) * Math.cos(centerLatRad),
        Math.cos(angularRadius) - Math.sin(centerLatRad) * Math.sin(pointLatRad),
      )

    points.push([(pointLatRad * 180) / Math.PI, (pointLonRad * 180) / Math.PI])
  }

  return points
}

// A ring far outside any reasonable map view, used as the outer boundary of a
// "mask everything except this circle" polygon (see MapView's radius overlay).
export const WORLD_COVERING_RING: [number, number][] = [
  [-85, -180],
  [-85, 180],
  [85, 180],
  [85, -180],
]
