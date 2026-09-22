import type { Risk } from "@/lib/mock-data"

export type ClassificationState = "verified" | "review" | "unknown"
export type Priority = "immediate" | "high" | "normal" | "observe"

export type EvidenceInput = {
  modelConfidence: number
  shapeScore: number
  shadowScore: number
  contextScore: number
  repeatCount?: number
  temporalAgreement?: number
  knownClass?: boolean
  hazardWeight?: number
  depth?: number
  proximityToRoute?: number
}

export type IntelligenceDecision = {
  evidenceScore: number
  temporalScore: number
  finalConfidence: number
  riskScore: number
  risk: Risk
  priority: Priority
  state: ClassificationState
  reasons: string[]
  evidence: {
    model: number
    shape: number
    shadow: number
    context: number
    temporal: number
  }
}

const clamp01 = (value: number) => Math.max(0, Math.min(1, value))

export function fuseEvidence(input: EvidenceInput): IntelligenceDecision {
  const model = clamp01(input.modelConfidence)
  const shape = clamp01(input.shapeScore)
  const shadow = clamp01(input.shadowScore)
  const context = clamp01(input.contextScore)
  const repeatCount = Math.max(0, input.repeatCount ?? 0)
  const agreement = clamp01(input.temporalAgreement ?? (repeatCount > 1 ? 0.9 : 0.55))
  const knownClass = input.knownClass ?? true
  const hazardWeight = clamp01(input.hazardWeight ?? 0.5)
  const depth = Math.max(0, input.depth ?? 20)
  const proximityToRoute = clamp01(input.proximityToRoute ?? 0.5)

  const evidenceScore =
    model * 0.55 +
    shape * 0.18 +
    shadow * 0.12 +
    context * 0.15

  const temporalBase = repeatCount === 0 ? 0.52 : Math.min(0.96, 0.58 + repeatCount * 0.09)
  const temporalScore = clamp01(temporalBase * 0.65 + agreement * 0.35)

  const finalConfidence = clamp01(
    evidenceScore * 0.72 +
      temporalScore * 0.18 +
      context * 0.10,
  )

  const depthFactor = clamp01(depth / 50)
  const riskScore = Math.round(
    clamp01(
      finalConfidence * 0.42 +
        hazardWeight * 0.32 +
        proximityToRoute * 0.16 +
        depthFactor * 0.10,
    ) * 100,
  )

  const reasons: string[] = []

  if (model >= 0.85) reasons.push("Strong model confidence")
  if (shape >= 0.75) reasons.push("Object geometry is consistent")
  if (shadow >= 0.75) reasons.push("Shadow/acoustic separation supports the contact")
  if (context >= 0.75) reasons.push("Local survey context supports classification")
  if (repeatCount >= 2) reasons.push(`Repeated observation ×${repeatCount}`)
  if (proximityToRoute >= 0.7) reasons.push("Close to an operational route")

  let state: ClassificationState = "verified"
  if (!knownClass || finalConfidence < 0.58) state = "unknown"
  else if (finalConfidence < 0.72) state = "review"

  if (state === "unknown") {
    reasons.unshift("Evidence is insufficient for a safe class assignment")
  } else if (state === "review") {
    reasons.unshift("Requires human verification before operational action")
  }

  const risk: Risk =
    riskScore >= 82 ? "critical" :
    riskScore >= 65 ? "high" :
    riskScore >= 42 ? "medium" :
    "low"

  const priority: Priority =
    risk === "critical" ? "immediate" :
    risk === "high" ? "high" :
    risk === "medium" ? "normal" :
    "observe"

  return {
    evidenceScore,
    temporalScore,
    finalConfidence,
    riskScore,
    risk,
    priority,
    state,
    reasons,
    evidence: {
      model,
      shape,
      shadow,
      context,
      temporal: temporalScore,
    },
  }
}

export function bboxEvidence(modelConfidence: number, width: number, height: number) {
  const aspect = width / Math.max(height, 0.01)
  const elongated = Math.min(1, Math.abs(Math.log(aspect)) / 2)
  const shapeScore = clamp01(0.84 - elongated * 0.28 + modelConfidence * 0.12)

  // These two channels intentionally remain conservative until the Python
  // inference service sends real acoustic/shape descriptors.
  const shadowScore = clamp01(0.55 + modelConfidence * 0.25)
  const contextScore = clamp01(0.58 + modelConfidence * 0.22)

  return { shapeScore, shadowScore, contextScore }
}

export type GeoPoint = { lat: number; lng: number }

export type Cluster = {
  id: string
  center: GeoPoint
  memberIds: string[]
  count: number
}

function haversineMeters(a: GeoPoint, b: GeoPoint) {
  const toRad = (v: number) => (v * Math.PI) / 180
  const R = 6371000
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2

  return 2 * R * Math.asin(Math.sqrt(h))
}

export function clusterPoints(
  points: Array<{ id: string; gps: GeoPoint }>,
  radiusMeters = 180,
): Cluster[] {
  const unassigned = new Set(points.map((p) => p.id))
  const clusters: Cluster[] = []

  while (unassigned.size) {
    const seedId = [...unassigned][0]
    const seed = points.find((p) => p.id === seedId)
    if (!seed) break

    const members = points.filter(
      (p) =>
        unassigned.has(p.id) &&
        haversineMeters(seed.gps, p.gps) <= radiusMeters,
    )

    members.forEach((m) => unassigned.delete(m.id))

    const center = members.reduce(
      (acc, item) => ({
        lat: acc.lat + item.gps.lat / members.length,
        lng: acc.lng + item.gps.lng / members.length,
      }),
      { lat: 0, lng: 0 },
    )

    clusters.push({
      id: `HOTSPOT-${String(clusters.length + 1).padStart(2, "0")}`,
      center,
      memberIds: members.map((m) => m.id),
      count: members.length,
    })
  }

  return clusters
}
