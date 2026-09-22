"use client"

import { useEffect, useMemo, useState } from "react"
import { Map, Crosshair, Layers, MapPin, Waves, Cloud, Loader2 } from "lucide-react"
import { Panel, PanelHeader } from "@/components/ui/panel"
import { RiskBadge } from "@/components/dashboard/risk-badge"
import { clusterPoints } from "@/lib/aquafusion"
import { cn } from "@/lib/utils"
import type { Detection, Risk } from "@/lib/mock-data"
import { subscribeToDetections } from "@/lib/firestore"

const riskFilters: (Risk | "all")[] = ["all", "critical", "high", "medium", "low"]

const nodeColor: Record<Risk, string> = {
  critical: "bg-destructive",
  high: "bg-warning",
  medium: "bg-primary",
  low: "bg-success",
}

type MapNode = Detection & { x: number; y: number }

function buildMapNodes(detections: Detection[]): MapNode[] {
  if (!detections.length) return []

  const lats = detections.map((detection) => detection.gps.lat)
  const lngs = detections.map((detection) => detection.gps.lng)
  const minLat = Math.min(...lats)
  const maxLat = Math.max(...lats)
  const minLng = Math.min(...lngs)
  const maxLng = Math.max(...lngs)
  const latRange = Math.max(maxLat - minLat, 0.001)
  const lngRange = Math.max(maxLng - minLng, 0.001)

  return detections.map((detection) => ({
    ...detection,
    x: ((detection.gps.lng - minLng) / lngRange) * 82 + 9,
    y: (1 - (detection.gps.lat - minLat) / latRange) * 72 + 14,
  }))
}

export default function DetectionMapPage() {
  const [filter, setFilter] = useState<Risk | "all">("all")
  const [selected, setSelected] = useState<string | null>(null)
  const [detections, setDetections] = useState<Detection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    return subscribeToDetections(
      (rows) => {
        setDetections(rows)
        setSelected((current) => current || rows[0]?.id || null)
        setLoading(false)
      },
      (subscriptionError) => {
        setError(subscriptionError.message || "Unable to load map detections.")
        setLoading(false)
      },
    )
  }, [])

  const mapNodes = useMemo(() => buildMapNodes(detections), [detections])

  const visible = useMemo(
    () => (filter === "all" ? mapNodes : mapNodes.filter((node) => node.risk === filter)),
    [filter, mapNodes],
  )

  const active = mapNodes.find((node) => node.id === selected) ?? null

  const hotspots = useMemo(
    () => clusterPoints(detections.map((detection) => ({ id: detection.id, gps: detection.gps })), 180),
    [detections],
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Cloud className="size-4" />
          </span>
          <div>
            <p className="text-xs font-semibold text-foreground">Live Firestore Detection Map</p>
            <p className="text-[11px] text-muted-foreground">
              Positions, risk and hotspot grouping are derived from the authenticated detection registry.
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 self-start rounded-full border border-success/25 bg-success/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide text-success sm:self-auto">
          <span className="size-1.5 animate-pulse rounded-full bg-success" />
          {loading ? "Syncing" : "Connected"}
        </span>
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-xs text-destructive">
          Detection map error: {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-4">
        <div className="xl:col-span-3">
          <Panel className="overflow-hidden">
            <PanelHeader
              title="Geospatial Detection Map"
              subtitle={loading ? "Loading live survey coordinates…" : `${detections.length} live contacts · ${hotspots.length} computed hotspots`}
              icon={<Map className="size-4" />}
              action={
                <div className="flex flex-wrap gap-1.5">
                  {riskFilters.map((risk) => (
                    <button
                      key={risk}
                      onClick={() => setFilter(risk)}
                      className={cn(
                        "rounded-full border px-2.5 py-1 text-xs font-medium capitalize transition-colors",
                        filter === risk
                          ? "border-primary/50 bg-primary/10 text-primary"
                          : "border-border/60 text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {risk}
                    </button>
                  ))}
                </div>
              }
            />
            <div className="relative aspect-[16/10] w-full overflow-hidden bg-[oklch(0.14_0.03_246)]">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_40%,oklch(0.24_0.05_220/50%),transparent_60%),radial-gradient(ellipse_at_75%_70%,oklch(0.2_0.05_200/40%),transparent_55%)]" />
              <div className="grid-sonar absolute inset-0 opacity-70" />

              <svg className="absolute inset-0 size-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                {[18, 30, 42].map((radius, index) => (
                  <circle
                    key={radius}
                    cx="30"
                    cy="40"
                    r={radius}
                    fill="none"
                    stroke="var(--primary)"
                    strokeOpacity={0.1 - index * 0.02}
                    strokeWidth="0.3"
                    strokeDasharray="1 1.5"
                  />
                ))}
              </svg>

              <div className="absolute left-4 top-4 flex items-center gap-2 rounded-md bg-background/60 px-2.5 py-1 font-mono text-[10px] text-primary backdrop-blur">
                <Waves className="size-3" /> LIVE SURVEY GRID
              </div>

              {loading ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-background/70 px-4 py-2 text-xs text-muted-foreground backdrop-blur">
                    <Loader2 className="size-3.5 animate-spin text-primary" /> Loading contacts…
                  </div>
                </div>
              ) : (
                visible.map((node) => (
                  <button
                    key={node.id}
                    onClick={() => setSelected(node.id)}
                    className="group absolute -translate-x-1/2 -translate-y-1/2"
                    style={{ left: `${node.x}%`, top: `${node.y}%` }}
                    aria-label={node.object}
                  >
                    <span className={cn("absolute inset-0 -m-2 animate-ping rounded-full opacity-40", nodeColor[node.risk])} />
                    <span
                      className={cn(
                        "relative flex size-3.5 items-center justify-center rounded-full ring-2 transition-all",
                        nodeColor[node.risk],
                        selected === node.id ? "scale-125 ring-foreground" : "ring-background/50",
                      )}
                    />
                    <span
                      className={cn(
                        "pointer-events-none absolute left-1/2 top-5 -translate-x-1/2 whitespace-nowrap rounded bg-background/80 px-1.5 py-0.5 font-mono text-[9px] text-foreground opacity-0 backdrop-blur transition-opacity group-hover:opacity-100",
                        selected === node.id && "opacity-100",
                      )}
                    >
                      {node.object}
                    </span>
                  </button>
                ))
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 px-5 py-3">
              <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                {(["critical", "high", "medium", "low"] as Risk[]).map((risk) => (
                  <span key={risk} className="inline-flex items-center gap-1.5">
                    <span className={cn("size-2 rounded-full", nodeColor[risk])} />
                    <span className="capitalize">{risk}</span>
                  </span>
                ))}
              </div>
              <span className="font-mono text-[11px] text-muted-foreground">
                {visible.length} contacts plotted
              </span>
            </div>
          </Panel>
        </div>

        <div className="space-y-6 xl:col-span-1">
          <Panel>
            <PanelHeader title="Contact Detail" subtitle="Selected live detection" icon={<Crosshair className="size-4" />} />
            {active ? (
              <div className="space-y-4 p-5">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-foreground">{active.object}</p>
                    <RiskBadge risk={active.risk} />
                  </div>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">{active.id}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Field icon={<Layers className="size-3.5" />} label="Depth" value={`${active.depth} m`} />
                  <Field icon={<MapPin className="size-3.5" />} label="Confidence" value={`${Math.round(active.confidence * 100)}%`} />
                </div>

                <div className="rounded-lg border border-border/60 bg-secondary/40 p-3">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">GPS</p>
                  <p className="mt-1 font-mono text-sm text-foreground">
                    {active.gps.lat.toFixed(4)}, {active.gps.lng.toFixed(4)}
                  </p>
                  <p className="mt-0.5 font-mono text-[11px] text-primary">Firestore synchronized</p>
                </div>

                <div className="rounded-lg border border-border/60 bg-secondary/30 p-3">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Mission</p>
                  <p className="mt-1 text-sm text-foreground">{active.mission}</p>
                  <p className="mt-1 text-xs capitalize text-muted-foreground">{active.status}</p>
                </div>
              </div>
            ) : (
              <p className="p-5 text-sm text-muted-foreground">No detection is currently selected.</p>
            )}
          </Panel>

          <Panel>
            <PanelHeader title="Contact List" subtitle={`${visible.length} in view`} icon={<Layers className="size-4" />} />
            <div className="max-h-80 divide-y divide-border/50 overflow-y-auto">
              {visible.map((node) => (
                <button
                  key={node.id}
                  onClick={() => setSelected(node.id)}
                  className={cn(
                    "flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors",
                    selected === node.id ? "bg-primary/5" : "hover:bg-secondary/50",
                  )}
                >
                  <span className={cn("size-2 rounded-full", nodeColor[node.risk])} />
                  <span className="min-w-0 flex-1 truncate text-sm text-foreground">{node.object}</span>
                  <span className="font-mono text-[11px] text-muted-foreground">{node.depth}m</span>
                </button>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  )
}

function Field({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/60 bg-secondary/40 p-3">
      <p className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground">
        {icon} {label}
      </p>
      <p className="mt-1 font-mono text-sm text-foreground">{value}</p>
    </div>
  )
}
