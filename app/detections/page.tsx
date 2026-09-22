"use client"

import { useEffect, useMemo, useState } from "react"
import { Search, ScanSearch, ArrowUpDown, Filter, Cloud, Loader2 } from "lucide-react"
import { Panel, PanelHeader } from "@/components/ui/panel"
import { RiskBadge, StatusPill } from "@/components/dashboard/risk-badge"
import { cn } from "@/lib/utils"
import type { Detection, Risk } from "@/lib/mock-data"
import { seedDetectionsIfEmpty, subscribeToDetections } from "@/lib/firestore"

const riskOrder: Record<Risk, number> = { critical: 0, high: 1, medium: 2, low: 3 }
const statusTone: Record<Detection["status"], "success" | "warning" | "muted"> = {
  confirmed: "success",
  pending: "warning",
  dismissed: "muted",
}
const categoryLabel: Record<Detection["category"], string> = {
  debris: "Debris",
  hazard: "Hazard",
  structure: "Structure",
  biological: "Biological",
  unknown: "Unknown",
}

type SortKey = "confidence" | "depth" | "risk" | "timestamp"

export default function DetectionsPage() {
  const [query, setQuery] = useState("")
  const [risk, setRisk] = useState<Risk | "all">("all")
  const [status, setStatus] = useState<Detection["status"] | "all">("all")
  const [sort, setSort] = useState<SortKey>("timestamp")
  const [asc, setAsc] = useState(false)
  const [detections, setDetections] = useState<Detection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [seeded, setSeeded] = useState(false)

  useEffect(() => {
    let active = true
    let unsubscribe: (() => void) | undefined

    const start = async () => {
      try {
        const didSeed = await seedDetectionsIfEmpty()
        if (!active) return
        setSeeded(didSeed)

        unsubscribe = subscribeToDetections(
          (rows) => {
            if (!active) return
            setDetections(rows)
            setLoading(false)
          },
          (subscriptionError) => {
            if (!active) return
            setError(subscriptionError.message || "Unable to load detection data.")
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

  const rows = useMemo(() => {
    let filtered = detections.filter((detection) => {
      const q = query.toLowerCase()
      const matchesQuery =
        !q ||
        detection.object.toLowerCase().includes(q) ||
        detection.id.toLowerCase().includes(q) ||
        detection.mission.toLowerCase().includes(q)
      const matchesRisk = risk === "all" || detection.risk === risk
      const matchesStatus = status === "all" || detection.status === status
      return matchesQuery && matchesRisk && matchesStatus
    })

    filtered = [...filtered].sort((a, b) => {
      let comparison = 0
      if (sort === "confidence") comparison = a.confidence - b.confidence
      else if (sort === "depth") comparison = a.depth - b.depth
      else if (sort === "risk") comparison = riskOrder[b.risk] - riskOrder[a.risk]
      else comparison = a.timestamp.localeCompare(b.timestamp)
      return asc ? comparison : -comparison
    })

    return filtered
  }, [detections, query, risk, status, sort, asc])

  const summary = useMemo(
    () => ({
      total: detections.length,
      confirmed: detections.filter((detection) => detection.status === "confirmed").length,
      pending: detections.filter((detection) => detection.status === "pending").length,
      critical: detections.filter((detection) => detection.risk === "critical").length,
    }),
    [detections],
  )

  const toggleSort = (key: SortKey) => {
    if (sort === key) setAsc((value) => !value)
    else {
      setSort(key)
      setAsc(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Cloud className="size-4" />
          </span>
          <div>
            <p className="text-xs font-semibold text-foreground">Live Firestore Detection Registry</p>
            <p className="text-[11px] text-muted-foreground">
              Authenticated detection data updates in real time.
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
          Demo detection records were initialized in Firestore because the detection collection was empty.
        </div>
      ) : null}

      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-xs text-destructive">
          Firestore detection data error: {error}
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Total", value: summary.total, tone: "text-foreground" },
          { label: "Confirmed", value: summary.confirmed, tone: "text-success" },
          { label: "Pending", value: summary.pending, tone: "text-warning" },
          { label: "Critical", value: summary.critical, tone: "text-destructive" },
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
          title="Detection Registry"
          subtitle="All classified sonar contacts"
          icon={<ScanSearch className="size-4" />}
          action={
            <div className="relative hidden sm:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search…"
                className="h-9 w-48 rounded-lg border border-border/60 bg-card/60 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          }
        />

        <div className="flex flex-wrap items-center gap-2 border-b border-border/60 px-5 py-3">
          <span className="mr-1 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <Filter className="size-3.5" /> Risk
          </span>
          {(["all", "critical", "high", "medium", "low"] as const).map((riskValue) => (
            <button
              key={riskValue}
              onClick={() => setRisk(riskValue)}
              className={cn(
                "rounded-full border px-2.5 py-1 text-xs font-medium capitalize transition-colors",
                risk === riskValue
                  ? "border-primary/50 bg-primary/10 text-primary"
                  : "border-border/60 text-muted-foreground hover:text-foreground",
              )}
            >
              {riskValue}
            </button>
          ))}
          <span className="mx-2 hidden h-4 w-px bg-border sm:block" />
          {(["all", "confirmed", "pending", "dismissed"] as const).map((statusValue) => (
            <button
              key={statusValue}
              onClick={() => setStatus(statusValue)}
              className={cn(
                "rounded-full border px-2.5 py-1 text-xs font-medium capitalize transition-colors",
                status === statusValue
                  ? "border-accent/50 bg-accent/10 text-accent"
                  : "border-border/60 text-muted-foreground hover:text-foreground",
              )}
            >
              {statusValue}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex min-h-64 items-center justify-center">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin text-primary" />
              Loading detections from Firestore…
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead>
                <tr className="border-b border-border/60 text-left font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
                  <th className="px-5 py-3 font-medium">ID</th>
                  <th className="px-3 py-3 font-medium">Object</th>
                  <th className="px-3 py-3 font-medium">Category</th>
                  <SortableTh label="Confidence" active={sort === "confidence"} asc={asc} onClick={() => toggleSort("confidence")} />
                  <SortableTh label="Depth" active={sort === "depth"} asc={asc} onClick={() => toggleSort("depth")} />
                  <th className="px-3 py-3 font-medium">GPS</th>
                  <SortableTh label="Risk" active={sort === "risk"} asc={asc} onClick={() => toggleSort("risk")} />
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Mission</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((detection) => (
                  <tr key={detection.id} className="border-b border-border/40 transition-colors hover:bg-secondary/40">
                    <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{detection.id}</td>
                    <td className="px-3 py-3 font-medium text-foreground">{detection.object}</td>
                    <td className="px-3 py-3">
                      <span className="rounded border border-border/60 bg-secondary/40 px-2 py-0.5 text-xs text-muted-foreground">
                        {categoryLabel[detection.category]}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-primary">{Math.round(detection.confidence * 100)}%</span>
                        <span className="h-1 w-10 overflow-hidden rounded-full bg-secondary">
                          <span
                            className="block h-full rounded-full bg-primary"
                            style={{ width: `${detection.confidence * 100}%` }}
                          />
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3 font-mono text-muted-foreground">{detection.depth} m</td>
                    <td className="px-3 py-3 font-mono text-xs text-muted-foreground">
                      {detection.gps.lat.toFixed(3)}, {detection.gps.lng.toFixed(3)}
                    </td>
                    <td className="px-3 py-3">
                      <RiskBadge risk={detection.risk} />
                    </td>
                    <td className="px-3 py-3">
                      <StatusPill label={detection.status} tone={statusTone[detection.status]} />
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{detection.mission}</td>
                  </tr>
                ))}
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-5 py-12 text-center text-sm text-muted-foreground">
                      No detections match the current filters.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}

        <div className="border-t border-border/60 px-5 py-3 text-xs text-muted-foreground">
          Showing <span className="font-mono text-foreground">{rows.length}</span> of{" "}
          <span className="font-mono text-foreground">{detections.length}</span> detections
        </div>
      </Panel>
    </div>
  )
}

function SortableTh({
  label,
  active,
  asc,
  onClick,
}: {
  label: string
  active: boolean
  asc: boolean
  onClick: () => void
}) {
  return (
    <th className="px-3 py-3 font-medium">
      <button
        onClick={onClick}
        className={cn("inline-flex items-center gap-1 transition-colors hover:text-foreground", active && "text-primary")}
      >
        {label}
        <ArrowUpDown className={cn("size-3", active && asc && "rotate-180")} />
      </button>
    </th>
  )
}
