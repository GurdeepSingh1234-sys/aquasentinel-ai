"use client"

import { useMemo, useState } from "react"
import { Navigation, Ship, Radar, ScanSearch, Clock, User } from "lucide-react"
import { Panel, PanelHeader } from "@/components/ui/panel"
import { StatusPill } from "@/components/dashboard/risk-badge"
import { Meter } from "@/components/charts/mini-charts"
import { cn } from "@/lib/utils"
import { missions, type Mission } from "@/lib/mock-data"

const statusTone: Record<Mission["status"], "success" | "primary" | "muted" | "destructive"> = {
  active: "success",
  queued: "primary",
  completed: "muted",
  aborted: "destructive",
}
const meterTone: Record<Mission["status"], "success" | "primary" | "accent" | "destructive"> = {
  active: "success",
  queued: "primary",
  completed: "accent",
  aborted: "destructive",
}

export default function MissionsPage() {
  const [filter, setFilter] = useState<Mission["status"] | "all">("all")
  const rows = useMemo(() => (filter === "all" ? missions : missions.filter((m) => m.status === filter)), [filter])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Active Sweeps", value: missions.filter((m) => m.status === "active").length, tone: "text-success" },
          { label: "Queued", value: missions.filter((m) => m.status === "queued").length, tone: "text-primary" },
          { label: "Total Coverage", value: `${missions.reduce((s, m) => s + m.coverage, 0).toFixed(1)}`, unit: "km²", tone: "text-foreground" },
          { label: "Detections", value: missions.reduce((s, m) => s + m.detections, 0), tone: "text-accent" },
        ].map((s) => (
          <Panel key={s.label} className="p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{s.label}</p>
            <p className={cn("mt-1 font-mono text-2xl font-semibold", s.tone)}>
              {s.value}
              {s.unit ? <span className="ml-1 text-sm font-normal text-muted-foreground">{s.unit}</span> : null}
            </p>
          </Panel>
        ))}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {(["all", "active", "queued", "completed", "aborted"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium capitalize transition-colors",
              filter === f ? "border-primary/50 bg-primary/10 text-primary" : "border-border/60 text-muted-foreground hover:text-foreground",
            )}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {rows.map((m) => (
          <Panel key={m.id} className="flex flex-col p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">{m.name}</p>
                <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">{m.id}</p>
              </div>
              <StatusPill label={m.status} tone={statusTone[m.status]} />
            </div>

            <div className="mt-4 space-y-3 text-sm">
              <Row icon={<Ship className="size-3.5" />} label="Vehicle" value={m.vehicle} />
              <Row icon={<Radar className="size-3.5" />} label="Area" value={m.area} />
              <div className="grid grid-cols-2 gap-3">
                <Row icon={<ScanSearch className="size-3.5" />} label="Detections" value={String(m.detections)} />
                <Row icon={<Navigation className="size-3.5" />} label="Coverage" value={`${m.coverage} km²`} />
              </div>
            </div>

            <div className="mt-4">
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-mono text-foreground">{m.progress}%</span>
              </div>
              <Meter value={m.progress} tone={meterTone[m.status]} />
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3 font-mono text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <User className="size-3" /> {m.operator}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="size-3" /> {m.startedAt.split(" ")[1]}
              </span>
            </div>
          </Panel>
        ))}
      </div>
    </div>
  )
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon} {label}
      </span>
      <span className="text-sm text-foreground">{value}</span>
    </div>
  )
}
