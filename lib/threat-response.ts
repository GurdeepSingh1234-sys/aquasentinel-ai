import type { GeoPoint } from "@/lib/aquafusion"

export type Threat = {
  id: string
  location: GeoPoint
  radiusMeters: number
}

export type RoutePoint = GeoPoint

export type ThreatResponse = {
  zone: GeoPoint[]
  route: RoutePoint[]
  blocked: boolean
  note: string
}

function offsetPoint(point: GeoPoint, northMeters: number, eastMeters: number): GeoPoint {
  const latScale = 111320
  const lngScale = 111320 * Math.cos((point.lat * Math.PI) / 180)
  return {
    lat: point.lat + northMeters / latScale,
    lng: point.lng + eastMeters / Math.max(lngScale, 1),
  }
}

function distanceMeters(a: GeoPoint, b: GeoPoint) {
  const latScale = 111320
  const meanLat = ((a.lat + b.lat) / 2) * (Math.PI / 180)
  const lngScale = 111320 * Math.cos(meanLat)
  const north = (b.lat - a.lat) * latScale
  const east = (b.lng - a.lng) * lngScale
  return Math.sqrt(north * north + east * east)
}

function circleZone(center: GeoPoint, radiusMeters: number): GeoPoint[] {
  return Array.from({ length: 20 }, (_, index) => {
    const angle = (index / 20) * Math.PI * 2
    return offsetPoint(
      center,
      Math.sin(angle) * radiusMeters,
      Math.cos(angle) * radiusMeters,
    )
  })
}

export function buildThreatResponse(
  start: GeoPoint,
  target: GeoPoint,
  threats: Threat[],
): ThreatResponse {
  const relevant = threats.filter(
    (threat) =>
      distanceMeters(threat.location, target) <= threat.radiusMeters * 2.5,
  )

  const zone = relevant.length
    ? circleZone(
        target,
        Math.max(...relevant.map((t) => t.radiusMeters)),
      )
    : circleZone(target, 30)

  let waypoint = target

  // Simple demonstration detour: shift away from the nearest threat.
  // A production planner should consume bathymetry, currents, vehicle
  // kinematics and no-go polygons from the survey system.
  if (relevant.length) {
    const nearest = relevant.sort(
      (a, b) => distanceMeters(a.location, target) - distanceMeters(b.location, target),
    )[0]

    const north = target.lat - nearest.location.lat
    const east = target.lng - nearest.location.lng
    const norm = Math.max(Math.sqrt(north * north + east * east), 0.000001)

    waypoint = offsetPoint(
      target,
      (north / norm) * (nearest.radiusMeters + 60),
      (east / norm) * (nearest.radiusMeters + 60),
    )
  }

  return {
    zone,
    route: [start, waypoint, target],
    blocked: relevant.length > 0,
    note: relevant.length
      ? "Recommended route includes a detour around the detected threat zone."
      : "No nearby threat zone intersects the direct inspection path.",
  }
}
