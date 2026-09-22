"use client"

import { useEffect, useMemo, useState } from "react"
import { Navigation, Ship, Radar, ScanSearch, Clock, User, Cloud, Loader2 } from "lucide-react"
import { Panel } from "@/components/ui/panel"
import { StatusPill } from "@/components/dashboard/risk-badge"
import { Meter } from "@/components/charts/mini-charts"
import { cn } from "@/lib/utils"
import type { Mission } from "@/lib/mock-data"
import { seedMissionsIfEmpty, subscribeToMissions } from "@/lib/firestore"

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
  const [missions, setMissions] = useState<Mission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [seeded, setSeeded] = useState(false)

  useEffect(() => {
    let active = true

    const start = async () => {
      try {
        await seedMissionsIfEmpty()
        if (!active) return
        setSeeded(true)

        const unsubscribe = subscribeToMissions(
          (rows) => {
            if (!active) return
            setMissions(rows)
            setLoading(false)
          },
          (subscriptionError) => {
            if (!active) return
            setError(subscriptionError.message || "Unable to load mission data.")
            setLoading(false)
          },
        )

        return unsubscribe
      } catch (seedError) {
        if (!active) return
        setError(seedError instanceof Error ? seedError.message : "Unable to connect to Firestore.")
        setLoading(false)
        return undefined
      }
    }

    let unsubscribe: (() => void) | undefined
    void start().then((cleanup) => {
      unsubscribe = cleanup
    })

    return () => {
      active = false
      unsubscribe?.()
    }
  }, [])

  const rows = useMemo(
    () => (filter === "all" ? missions : missions.filter((mission) => mission.status === filter)),
    [filter, missions],
  )

  const summary = useMemo(
    () => ({
      active: missions.filter((mission) => mission.status === "active").length,
      queued: missions.filter((mission) => mission.status === "queued").length,
      coverage: missions.reduce((sum, mission) => sum + mission.coverage, 0),
      detections: missions.reduce((sum, mission) => sum + mission.detections, 0),
    }),
    [missions],
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Cloud className="size-4" />
          </span>
          <div>
            <p className="text-xs font-semibold text-foreground">Live Firestore Mission Registry</p>
            <p className="text-[11px] text-muted-foreground">
              Shared mission data updates in real time for authenticated operators.
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 self-start rounded-full border border-success/25 bg-success/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide text-success sm:self-auto">
          <span className="size-1.5 animate-pulse rounded-full bg-success" />
          Connected
        </span>
      </div>

      {seeded ? (
        <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-muted-foreground">
          Demo mission records were initialized in Firestore because the mission collection was empty.
        </div>
      ) : null}

      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-xs text-destructive">
          Firestore mission data error: {error}
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Active Sweeps", value: summary.active, tone: "text-success" },
          { label: "Queued", value: summary.queued, tone: "text-primary" },
          { label: "Total Coverage", value: summary.coverage.toFixed(1), unit: "km²", tone: "text-foreground" },
          { label: "Detections", value: summary.detections, tone: "text-accent" },
        ].map((stat) => (
          <Panel key={stat.label} className="p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{stat.label}</p>
            <p className={cn("mt-1 font-mono text-2xl font-semibold", stat.tone)}>
              {loading ? "—" : stat.value}
              {!loading && stat.unit ? <span className="ml-1 text-sm font-normal text-muted-foreground">{stat.unit}</span> : null}
            </p>
          </Panel>
        ))}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {(["all", "active", "queued", "completed", "aborted"] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium capitalize transition-colors",
              filter === status ? "border-primary/50 bg-primary/10 text-primary" : "border-border/60 text-muted-foreground hover:text-foreground",
            )}
          >
            {status}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex min-h-56 items-center justify-center rounded-xl border border-border/60 bg-card/40">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin text-primary" />
            Loading missions from Firestore…
          </div>
        </div>
      ) : rows.length === 0 ? (
        <div className="flex min-h-56 items-center justify-center rounded-xl border border-dashed border-border/60 bg-card/30 text-sm text-muted-foreground">
          No missions match the selected filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((mission) => (
            <Panel key={mission.id} className="flex flex-col p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">{mission.name}</p>
                  <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">{mission.id}</p>
                </div>
                <StatusPill label={mission.status} tone={statusTone[mission.status]} />
              </div>

              <div className="mt-4 space-y-3 text-sm">
                <Row icon={<Ship className="size-3.5" />} label="Vehicle" value={mission.vehicle} />
                <Row icon={<Radar className="size-3.5" />} label="Area" value={mission.area} />
                <div className="grid grid-cols-2 gap-3">
                  <Row icon={<ScanSearch className="size-3.5" />} label="Detections" value={String(mission.detections)} />
                  <Row icon={<Navigation className="size-3.5" />} label="Coverage" value={`${mission.coverage} km²`} />
                </div>
              </div>

              <div className="mt-4">
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-mono text-foreground">{mission.progress}%</span>
                </div>
                <Meter value={mission.progress} tone={meterTone[mission.status]} />
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3 font-mono text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <User className="size-3" /> {mission.operator}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="size-3" /> {mission.startedAt.split(" ")[1] ?? "—"}
                </span>
              </div>
            </Panel>
          ))}
        </div>
      )}
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
