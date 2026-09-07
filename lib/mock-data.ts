export type Risk = "critical" | "high" | "medium" | "low"

export type Detection = {
  id: string
  object: string
  category: "debris" | "hazard" | "structure" | "biological" | "unknown"
  confidence: number
  depth: number
  gps: { lat: number; lng: number }
  risk: Risk
  mission: string
  timestamp: string
  status: "confirmed" | "pending" | "dismissed"
}

export type BBox = {
  id: string
  label: string
  confidence: number
  depth: number
  gps: { lat: number; lng: number }
  risk: Risk
  // normalized 0-1 coordinates
  x: number
  y: number
  w: number
  h: number
}

export type SonarSample = {
  id: string
  name: string
  src: string
  location: string
  depthRange: string
  resolution: string
  boxes: BBox[]
}

export const riskMeta: Record<Risk, { label: string; color: string; dot: string; bg: string }> = {
  critical: { label: "Critical", color: "text-destructive", dot: "bg-destructive", bg: "bg-destructive/10" },
  high: { label: "High", color: "text-warning", dot: "bg-warning", bg: "bg-warning/10" },
  medium: { label: "Medium", color: "text-primary", dot: "bg-primary", bg: "bg-primary/10" },
  low: { label: "Low", color: "text-success", dot: "bg-success", bg: "bg-success/10" },
}

export const sonarSamples: SonarSample[] = [
  {
    id: "SS-4471",
    name: "Harbour Approach — Sector 7",
    src: "/sonar/sonar-01.png",
    location: "12.9141° N, 74.8560° E",
    depthRange: "8–24 m",
    resolution: "2048 × 1024",
    boxes: [
      { id: "d1", label: "Metallic Debris", confidence: 0.962, depth: 18.4, gps: { lat: 12.9142, lng: 74.856 }, risk: "high", x: 0.61, y: 0.28, w: 0.14, h: 0.12 },
      { id: "d2", label: "Shipwreck Fragment", confidence: 0.894, depth: 22.1, gps: { lat: 12.9138, lng: 74.8555 }, risk: "critical", x: 0.2, y: 0.58, w: 0.22, h: 0.18 },
      { id: "d3", label: "Discarded Net", confidence: 0.771, depth: 15.9, gps: { lat: 12.9145, lng: 74.8564 }, risk: "medium", x: 0.72, y: 0.66, w: 0.12, h: 0.1 },
    ],
  },
  {
    id: "SS-4472",
    name: "Debris Field — Bay Delta",
    src: "/sonar/sonar-02.png",
    location: "13.0827° N, 80.2707° E",
    depthRange: "12–31 m",
    resolution: "2048 × 1024",
    boxes: [
      { id: "d4", label: "Corroded Barrel", confidence: 0.933, depth: 26.7, gps: { lat: 13.0829, lng: 80.2711 }, risk: "critical", x: 0.3, y: 0.32, w: 0.1, h: 0.13 },
      { id: "d5", label: "Tire Cluster", confidence: 0.842, depth: 19.2, gps: { lat: 13.0824, lng: 80.2702 }, risk: "medium", x: 0.55, y: 0.52, w: 0.16, h: 0.12 },
      { id: "d6", label: "Metal Fragment", confidence: 0.688, depth: 23.5, gps: { lat: 13.0831, lng: 80.2715 }, risk: "low", x: 0.78, y: 0.24, w: 0.09, h: 0.08 },
    ],
  },
  {
    id: "SS-4473",
    name: "Reef Transect — Ridge East",
    src: "/sonar/sonar-03.png",
    location: "8.5241° N, 76.9366° E",
    depthRange: "20–48 m",
    resolution: "2048 × 1024",
    boxes: [
      { id: "d7", label: "Sunken Container", confidence: 0.978, depth: 41.3, gps: { lat: 8.5243, lng: 76.9369 }, risk: "critical", x: 0.24, y: 0.4, w: 0.26, h: 0.2 },
      { id: "d8", label: "Pipeline Segment", confidence: 0.905, depth: 38.6, gps: { lat: 8.5238, lng: 76.9361 }, risk: "high", x: 0.6, y: 0.62, w: 0.28, h: 0.09 },
    ],
  },
]

export const detections: Detection[] = [
  { id: "DET-9021", object: "Sunken Container", category: "hazard", confidence: 0.978, depth: 41.3, gps: { lat: 8.5243, lng: 76.9369 }, risk: "critical", mission: "M-118", timestamp: "2026-09-07 09:14", status: "confirmed" },
  { id: "DET-9020", object: "Corroded Barrel", category: "hazard", confidence: 0.933, depth: 26.7, gps: { lat: 13.0829, lng: 80.2711 }, risk: "critical", mission: "M-117", timestamp: "2026-09-07 08:47", status: "confirmed" },
  { id: "DET-9019", object: "Metallic Debris", category: "debris", confidence: 0.962, depth: 18.4, gps: { lat: 12.9142, lng: 74.856 }, risk: "high", mission: "M-116", timestamp: "2026-09-07 08:22", status: "confirmed" },
  { id: "DET-9018", object: "Pipeline Segment", category: "structure", confidence: 0.905, depth: 38.6, gps: { lat: 8.5238, lng: 76.9361 }, risk: "high", mission: "M-118", timestamp: "2026-09-07 07:55", status: "pending" },
  { id: "DET-9017", object: "Shipwreck Fragment", category: "structure", confidence: 0.894, depth: 22.1, gps: { lat: 12.9138, lng: 74.8555 }, risk: "critical", mission: "M-116", timestamp: "2026-09-06 22:31", status: "confirmed" },
  { id: "DET-9016", object: "Tire Cluster", category: "debris", confidence: 0.842, depth: 19.2, gps: { lat: 13.0824, lng: 80.2702 }, risk: "medium", mission: "M-117", timestamp: "2026-09-06 21:08", status: "confirmed" },
  { id: "DET-9015", object: "Discarded Net", category: "debris", confidence: 0.771, depth: 15.9, gps: { lat: 12.9145, lng: 74.8564 }, risk: "medium", mission: "M-116", timestamp: "2026-09-06 19:44", status: "pending" },
  { id: "DET-9014", object: "Unknown Sonar Return", category: "unknown", confidence: 0.612, depth: 33.8, gps: { lat: 8.5251, lng: 76.9358 }, risk: "low", mission: "M-118", timestamp: "2026-09-06 18:20", status: "pending" },
  { id: "DET-9013", object: "Metal Fragment", category: "debris", confidence: 0.688, depth: 23.5, gps: { lat: 13.0831, lng: 80.2715 }, risk: "low", mission: "M-117", timestamp: "2026-09-06 16:02", status: "dismissed" },
  { id: "DET-9012", object: "Fishing Trap", category: "debris", confidence: 0.804, depth: 12.4, gps: { lat: 12.915, lng: 74.857 }, risk: "medium", mission: "M-115", timestamp: "2026-09-06 14:39", status: "confirmed" },
]

export type Anomaly = {
  id: string
  type: string
  description: string
  severity: Risk
  confidence: number
  location: string
  detectedAt: string
  status: "investigating" | "resolved" | "new"
}

export const anomalies: Anomaly[] = [
  { id: "ANM-330", type: "Acoustic Void", description: "Unexpected signal dropout across 40m swath — possible sensor occlusion or deep trench.", severity: "high", confidence: 0.88, location: "Sector 7 · Ridge East", detectedAt: "2026-09-07 09:02", status: "investigating" },
  { id: "ANM-329", type: "Thermal Plume", description: "Localized return distortion consistent with warm-water discharge near seabed.", severity: "medium", confidence: 0.74, location: "Bay Delta", detectedAt: "2026-09-07 07:41", status: "new" },
  { id: "ANM-328", type: "Ferrous Cluster", description: "Dense metallic signature grouping inconsistent with mapped wreck sites.", severity: "critical", confidence: 0.91, location: "Harbour Approach", detectedAt: "2026-09-06 23:18", status: "investigating" },
  { id: "ANM-327", type: "Sediment Shift", description: "Rapid bathymetric change vs. prior survey baseline — possible scouring event.", severity: "low", confidence: 0.66, location: "Sector 4", detectedAt: "2026-09-06 20:55", status: "resolved" },
  { id: "ANM-326", type: "Multipath Echo", description: "Repeating phantom return pattern flagged by classifier as non-physical.", severity: "medium", confidence: 0.7, location: "Reef Transect", detectedAt: "2026-09-06 17:12", status: "resolved" },
]

export type Mission = {
  id: string
  name: string
  vehicle: string
  status: "active" | "queued" | "completed" | "aborted"
  progress: number
  area: string
  coverage: number
  detections: number
  startedAt: string
  operator: string
}

export const missions: Mission[] = [
  { id: "M-118", name: "Ridge East Deep Sweep", vehicle: "AUV Nereus-2", status: "active", progress: 63, area: "Reef Transect", coverage: 4.8, detections: 7, startedAt: "2026-09-07 06:30", operator: "Cmdr. A. Rao" },
  { id: "M-117", name: "Bay Delta Debris Survey", vehicle: "AUV Triton-1", status: "active", progress: 88, area: "Bay Delta", coverage: 6.2, detections: 12, startedAt: "2026-09-07 05:10", operator: "Lt. S. Iyer" },
  { id: "M-119", name: "Harbour Night Patrol", vehicle: "AUV Nereus-2", status: "queued", progress: 0, area: "Harbour Approach", coverage: 0, detections: 0, startedAt: "2026-09-07 21:00", operator: "Cmdr. A. Rao" },
  { id: "M-116", name: "Sector 7 Baseline Scan", vehicle: "AUV Triton-1", status: "completed", progress: 100, area: "Harbour Approach", coverage: 9.4, detections: 18, startedAt: "2026-09-06 08:00", operator: "Lt. S. Iyer" },
  { id: "M-115", name: "Coastal Grid Alpha", vehicle: "ROV Kelpie", status: "completed", progress: 100, area: "Sector 4", coverage: 3.1, detections: 5, startedAt: "2026-09-05 09:30", operator: "Ens. D. Kaur" },
  { id: "M-114", name: "Trench Recon", vehicle: "AUV Nereus-2", status: "aborted", progress: 34, area: "Ridge East", coverage: 1.7, detections: 2, startedAt: "2026-09-04 11:15", operator: "Cmdr. A. Rao" },
]

export type Report = {
  id: string
  title: string
  type: "survey" | "incident" | "compliance" | "summary"
  mission: string
  generatedAt: string
  size: string
  author: string
}

export const reports: Report[] = [
  { id: "RPT-2041", title: "Ridge East Deep Sweep — Detection Summary", type: "survey", mission: "M-118", generatedAt: "2026-09-07 09:20", size: "4.2 MB", author: "AquaSentinel AI" },
  { id: "RPT-2040", title: "Critical Hazard Incident — Sunken Container", type: "incident", mission: "M-118", generatedAt: "2026-09-07 09:16", size: "1.8 MB", author: "Cmdr. A. Rao" },
  { id: "RPT-2039", title: "Bay Delta Debris Field Assessment", type: "survey", mission: "M-117", generatedAt: "2026-09-07 08:50", size: "6.7 MB", author: "AquaSentinel AI" },
  { id: "RPT-2038", title: "Weekly Environmental Compliance Digest", type: "compliance", mission: "—", generatedAt: "2026-09-06 18:00", size: "2.1 MB", author: "AquaSentinel AI" },
  { id: "RPT-2037", title: "Sector 7 Baseline Scan — Full Report", type: "survey", mission: "M-116", generatedAt: "2026-09-06 22:40", size: "9.1 MB", author: "AquaSentinel AI" },
  { id: "RPT-2036", title: "Fleet Operations Summary — Week 36", type: "summary", mission: "—", generatedAt: "2026-09-06 12:00", size: "3.4 MB", author: "Lt. S. Iyer" },
]

// Sonar activity waterfall (per hour, arbitrary intensity 0-100)
export const sonarActivity: number[] = [
  32, 41, 38, 52, 61, 48, 55, 72, 68, 84, 79, 91, 88, 76, 82, 69, 74, 58, 63, 49, 44, 37, 29, 34,
]

export const detectionTrend: { day: string; debris: number; hazards: number }[] = [
  { day: "Mon", debris: 12, hazards: 3 },
  { day: "Tue", debris: 18, hazards: 5 },
  { day: "Wed", debris: 9, hazards: 2 },
  { day: "Thu", debris: 22, hazards: 7 },
  { day: "Fri", debris: 16, hazards: 4 },
  { day: "Sat", debris: 27, hazards: 9 },
  { day: "Sun", debris: 21, hazards: 6 },
]

export const riskDistribution: { risk: Risk; count: number }[] = [
  { risk: "critical", count: 14 },
  { risk: "high", count: 31 },
  { risk: "medium", count: 58 },
  { risk: "low", count: 42 },
]

// Detection map nodes (normalized 0-1 within the map canvas)
export const mapNodes: { id: string; x: number; y: number; risk: Risk; label: string; depth: number }[] = [
  { id: "DET-9021", x: 0.22, y: 0.34, risk: "critical", label: "Sunken Container", depth: 41.3 },
  { id: "DET-9020", x: 0.58, y: 0.28, risk: "critical", label: "Corroded Barrel", depth: 26.7 },
  { id: "DET-9019", x: 0.7, y: 0.55, risk: "high", label: "Metallic Debris", depth: 18.4 },
  { id: "DET-9018", x: 0.4, y: 0.62, risk: "high", label: "Pipeline Segment", depth: 38.6 },
  { id: "DET-9017", x: 0.3, y: 0.48, risk: "critical", label: "Shipwreck Fragment", depth: 22.1 },
  { id: "DET-9016", x: 0.62, y: 0.72, risk: "medium", label: "Tire Cluster", depth: 19.2 },
  { id: "DET-9015", x: 0.82, y: 0.4, risk: "medium", label: "Discarded Net", depth: 15.9 },
  { id: "DET-9014", x: 0.48, y: 0.24, risk: "low", label: "Unknown Return", depth: 33.8 },
  { id: "DET-9012", x: 0.15, y: 0.68, risk: "medium", label: "Fishing Trap", depth: 12.4 },
]
