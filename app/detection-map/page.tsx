"use client"

import { useMemo, useState } from "react"
import { Map, Crosshair, Layers, MapPin, Waves } from "lucide-react"
import { Panel, PanelHeader } from "@/components/ui/panel"
import { RiskBadge } from "@/components/dashboard/risk-badge"
import { cn } from "@/lib/utils"
import { mapNodes, riskMeta, type Risk } from "@/lib/mock-data"

const riskFilters: (Risk | "all")[] = ["all", "critical", "high", "medium", "low"]

const nodeColor: Record<Risk, string> = {
  critical: "bg-destructive",
  high: "bg-warning",
  medium: "bg-primary",
  low: "bg-success",
}

export default function DetectionMapPage() {
  const [filter, setFilter] = useState<Risk | "all">("all")
  const [selected, setSelected] = useState<string | null>("DET-9021")

  const visible = useMemo(
    () => (filter === "all" ? mapNodes : mapNodes.filter((n) => n.risk === filter)),
    [filter],
  )
  const active = mapNodes.find((n) => n.id === selected) ?? null

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-4">
      <div className="xl:col-span-3">
        <Panel className="overflow-hidden">
          <PanelHeader
            title="Geospatial Detection Map"
            subtitle="Survey area · Coastal Grid · 128.4 km²"
            icon={<Map className="size-4" />}
            action={
              <div className="flex flex-wrap gap-1.5">
                {riskFilters.map((r) => (
                  <button
                    key={r}
                    onClick={() => setFilter(r)}
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-xs font-medium capitalize transition-colors",
                      filter === r
                        ? "border-primary/50 bg-primary/10 text-primary"
                        : "border-border/60 text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>
            }
          />
          <div className="relative aspect-[16/10] w-full overflow-hidden bg-[oklch(0.14_0.03_246)]">
            {/* bathymetric gradient */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_40%,oklch(0.24_0.05_220/50%),transparent_60%),radial-gradient(ellipse_at_75%_70%,oklch(0.2_0.05_200/40%),transparent_55%)]" />
            <div className="grid-sonar absolute inset-0 opacity-70" />
            {/* depth contour rings */}
            <svg className="absolute inset-0 size-full" preserveAspectRatio="none" viewBox="0 0 100 100">
              {[18, 30, 42].map((r, i) => (
                <circle
                  key={r}
                  cx="30"
                  cy="40"
                  r={r}
                  fill="none"
                  stroke="var(--primary)"
                  strokeOpacity={0.1 - i * 0.02}
                  strokeWidth="0.3"
                  strokeDasharray="1 1.5"
                />
              ))}
            </svg>

            {/* coastline label */}
            <div className="absolute left-4 top-4 flex items-center gap-2 rounded-md bg-background/60 px-2.5 py-1 font-mono text-[10px] text-primary backdrop-blur">
              <Waves className="size-3" /> BATHYMETRIC SURVEY GRID
            </div>

            {/* nodes */}
            {visible.map((n) => (
              <button
                key={n.id}
                onClick={() => setSelected(n.id)}
                className="group absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${n.x * 100}%`, top: `${n.y * 100}%` }}
                aria-label={n.label}
              >
                <span className={cn("absolute inset-0 -m-2 animate-ping rounded-full opacity-40", nodeColor[n.risk])} />
                <span
                  className={cn(
                    "relative flex size-3.5 items-center justify-center rounded-full ring-2 transition-all",
                    nodeColor[n.risk],
                    selected === n.id ? "ring-foreground scale-125" : "ring-background/50",
                  )}
                />
                <span
                  className={cn(
                    "pointer-events-none absolute left-1/2 top-5 -translate-x-1/2 whitespace-nowrap rounded bg-background/80 px-1.5 py-0.5 font-mono text-[9px] text-foreground opacity-0 backdrop-blur transition-opacity group-hover:opacity-100",
                    selected === n.id && "opacity-100",
                  )}
                >
                  {n.label}
                </span>
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 px-5 py-3">
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
              {(["critical", "high", "medium", "low"] as Risk[]).map((r) => (
                <span key={r} className="inline-flex items-center gap-1.5">
                  <span className={cn("size-2 rounded-full", nodeColor[r])} />
                  <span className="capitalize">{r}</span>
                </span>
              ))}
            </div>
            <span className="font-mono text-[11px] text-muted-foreground">{visible.length} contacts plotted</span>
          </div>
        </Panel>
      </div>

      {/* detail sidebar */}
      <div className="space-y-6 xl:col-span-1">
        <Panel>
          <PanelHeader title="Contact Detail" subtitle="Selected map node" icon={<Crosshair className="size-4" />} />
          {active ? (
            <div className="space-y-4 p-5">
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-foreground">{active.label}</p>
                  <RiskBadge risk={active.risk} />
                </div>
                <p className="mt-1 font-mono text-xs text-muted-foreground">{active.id}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field icon={<Layers className="size-3.5" />} label="Depth" value={`${active.depth} m`} />
                <Field icon={<MapPin className="size-3.5" />} label="Risk" value={riskMeta[active.risk].label} />
              </div>
              <div className="rounded-lg border border-border/60 bg-secondary/40 p-3">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Position</p>
                <p className="mt-1 font-mono text-sm text-foreground">
                  {(active.x * 100).toFixed(1)}%, {(active.y * 100).toFixed(1)}%
                </p>
                <p className="mt-0.5 font-mono text-[11px] text-primary">grid-referenced</p>
              </div>
            </div>
          ) : (
            <p className="p-5 text-sm text-muted-foreground">Select a node on the map to inspect it.</p>
          )}
        </Panel>

        <Panel>
          <PanelHeader title="Contact List" subtitle={`${visible.length} in view`} icon={<Layers className="size-4" />} />
          <div className="max-h-80 divide-y divide-border/50 overflow-y-auto">
            {visible.map((n) => (
              <button
                key={n.id}
                onClick={() => setSelected(n.id)}
                className={cn(
                  "flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors",
                  selected === n.id ? "bg-primary/5" : "hover:bg-secondary/50",
                )}
              >
                <span className={cn("size-2 rounded-full", nodeColor[n.risk])} />
                <span className="min-w-0 flex-1 truncate text-sm text-foreground">{n.label}</span>
                <span className="font-mono text-[11px] text-muted-foreground">{n.depth}m</span>
              </button>
            ))}
          </div>
        </Panel>
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
