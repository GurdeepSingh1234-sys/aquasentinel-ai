"use client"

import { useEffect, useMemo, useState } from "react"
import { TriangleAlert, Waves, Activity, Radio, ThermometerSun, Magnet, Cloud, Loader2 } from "lucide-react"
import { Panel, PanelHeader } from "@/components/ui/panel"
import { RiskBadge, StatusPill } from "@/components/dashboard/risk-badge"
import { cn } from "@/lib/utils"
import type { Anomaly } from "@/lib/mock-data"
import { seedAnomaliesIfEmpty, subscribeToAnomalies } from "@/lib/firestore"

const typeIcon: Record<string, React.ReactNode> = {
  "Acoustic Void": <Radio className="size-4" />,
  "Thermal Plume": <ThermometerSun className="size-4" />,
  "Ferrous Cluster": <Magnet className="size-4" />,
  "Sediment Shift": <Waves className="size-4" />,
  "Multipath Echo": <Activity className="size-4" />,
}

const statusTone: Record<Anomaly["status"], "primary" | "warning" | "success"> = {
  new: "warning",
  investigating: "primary",
  resolved: "success",
}

export default function AnomaliesPage() {
  const [tab, setTab] = useState<Anomaly["status"] | "all">("all")
  const [anomalies, setAnomalies] = useState<Anomaly[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [seeded, setSeeded] = useState(false)

  useEffect(() => {
    let active = true
    let unsubscribe: (() => void) | undefined

    const start = async () => {
      try {
        const didSeed = await seedAnomaliesIfEmpty()
        if (!active) return
        setSeeded(didSeed)

        unsubscribe = subscribeToAnomalies(
          (rows) => {
            if (!active) return
            setAnomalies(rows)
            setLoading(false)
          },
          (subscriptionError) => {
            if (!active) return
            setError(subscriptionError.message || "Unable to load anomaly data.")
            setLoading(false)
          },
        )
      } catch (loadError) {
        if (!active) return
        setError(loadError instanceof Error ? loadError.message : "Unable to connect to Firestore.")
        setLoading(false)
      }
    }

    void start()

    return () => {
      active = false
      unsubscribe?.()
    }
  }, [])

  const rows = useMemo(
    () => (tab === "all" ? anomalies : anomalies.filter((anomaly) => anomaly.status === tab)),
    [tab, anomalies],
  )

  const summary = useMemo(
    () => ({
      active: anomalies.filter((anomaly) => anomaly.status !== "resolved").length,
      investigating: anomalies.filter((anomaly) => anomaly.status === "investigating").length,
      critical: anomalies.filter((anomaly) => anomaly.severity === "critical").length,
      resolved: anomalies.filter((anomaly) => anomaly.status === "resolved").length,
    }),
    [anomalies],
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Cloud className="size-4" />
          </span>
          <div>
            <p className="text-xs font-semibold text-foreground">Live Firestore Anomaly Feed</p>
            <p className="text-[11px] text-muted-foreground">
              Authenticated anomaly data updates in real time.
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
          Demo anomaly records were initialized in Firestore because the anomaly collection was empty.
        </div>
      ) : null}

      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-xs text-destructive">
          Firestore anomaly data error: {error}
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Active Anomalies", value: summary.active, tone: "text-warning" },
          { label: "Investigating", value: summary.investigating, tone: "text-primary" },
          { label: "Critical", value: summary.critical, tone: "text-destructive" },
          { label: "Resolved (7d)", value: summary.resolved, tone: "text-success" },
        ].map((stat) => (
          <Panel key={stat.label} className="p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{stat.label}</p>
            <p className={cn("mt-1 font-mono text-2xl font-semibold", stat.tone)}>
              {loading ? "—" : stat.value}
            </p>
          </Panel>
        ))}
      </div>

      <Panel>
        <PanelHeader
          title="Anomaly Feed"
          subtitle="Non-standard acoustic signatures flagged by AI classifier"
          icon={<TriangleAlert className="size-4" />}
          action={
            <div className="flex flex-wrap gap-1.5">
              {(["all", "new", "investigating", "resolved"] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setTab(status)}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-xs font-medium capitalize transition-colors",
                    tab === status
                      ? "border-primary/50 bg-primary/10 text-primary"
                      : "border-border/60 text-muted-foreground hover:text-foreground",
                  )}
                >
                  {status}
                </button>
              ))}
            </div>
          }
        />
        {loading ? (
          <div className="flex min-h-56 items-center justify-center">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin text-primary" />
              Loading anomalies from Firestore…
            </div>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {rows.map((anomaly) => (
              <div key={anomaly.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-start">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
                  {typeIcon[anomaly.type] ?? <TriangleAlert className="size-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">{anomaly.type}</p>
                    <span className="font-mono text-[11px] text-muted-foreground">{anomaly.id}</span>
                    <RiskBadge risk={anomaly.severity} />
                    <StatusPill label={anomaly.status} tone={statusTone[anomaly.status]} />
                  </div>
                  <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">{anomaly.description}</p>
                  <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 font-mono text-[11px] text-muted-foreground">
                    <span>LOC {anomaly.location}</span>
                    <span>CONF {Math.round(anomaly.confidence * 100)}%</span>
                    <span>{anomaly.detectedAt}</span>
                  </div>
                </div>
                <button className="self-start rounded-lg border border-border/70 bg-card/60 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary/60">
                  Investigate
                </button>
              </div>
            ))}
            {rows.length === 0 ? (
              <div className="px-5 py-12 text-center text-sm text-muted-foreground">
                No anomalies match the selected filter.
              </div>
            ) : null}
          </div>
        )}
      </Panel>
    </div>
  )
}
