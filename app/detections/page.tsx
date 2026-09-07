"use client"

import { useMemo, useState } from "react"
import { Search, ScanSearch, ArrowUpDown, Filter } from "lucide-react"
import { Panel, PanelHeader } from "@/components/ui/panel"
import { RiskBadge, StatusPill } from "@/components/dashboard/risk-badge"
import { cn } from "@/lib/utils"
import { detections, type Detection, type Risk } from "@/lib/mock-data"

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

  const rows = useMemo(() => {
    let r = detections.filter((d) => {
      const q = query.toLowerCase()
      const matchesQuery =
        !q || d.object.toLowerCase().includes(q) || d.id.toLowerCase().includes(q) || d.mission.toLowerCase().includes(q)
      const matchesRisk = risk === "all" || d.risk === risk
      const matchesStatus = status === "all" || d.status === status
      return matchesQuery && matchesRisk && matchesStatus
    })
    r = [...r].sort((a, b) => {
      let cmp = 0
      if (sort === "confidence") cmp = a.confidence - b.confidence
      else if (sort === "depth") cmp = a.depth - b.depth
      else if (sort === "risk") cmp = riskOrder[b.risk] - riskOrder[a.risk]
      else cmp = a.timestamp.localeCompare(b.timestamp)
      return asc ? cmp : -cmp
    })
    return r
  }, [query, risk, status, sort, asc])

  const toggleSort = (key: SortKey) => {
    if (sort === key) setAsc((v) => !v)
    else {
      setSort(key)
      setAsc(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* summary chips */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Total", value: detections.length, tone: "text-foreground" },
          { label: "Confirmed", value: detections.filter((d) => d.status === "confirmed").length, tone: "text-success" },
          { label: "Pending", value: detections.filter((d) => d.status === "pending").length, tone: "text-warning" },
          { label: "Critical", value: detections.filter((d) => d.risk === "critical").length, tone: "text-destructive" },
        ].map((s) => (
          <Panel key={s.label} className="p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{s.label}</p>
            <p className={cn("mt-1 font-mono text-2xl font-semibold", s.tone)}>{s.value}</p>
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
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search…"
                className="h-9 w-48 rounded-lg border border-border/60 bg-card/60 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          }
        />

        {/* filters */}
        <div className="flex flex-wrap items-center gap-2 border-b border-border/60 px-5 py-3">
          <span className="mr-1 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <Filter className="size-3.5" /> Risk
          </span>
          {(["all", "critical", "high", "medium", "low"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRisk(r)}
              className={cn(
                "rounded-full border px-2.5 py-1 text-xs font-medium capitalize transition-colors",
                risk === r ? "border-primary/50 bg-primary/10 text-primary" : "border-border/60 text-muted-foreground hover:text-foreground",
              )}
            >
              {r}
            </button>
          ))}
          <span className="mx-2 hidden h-4 w-px bg-border sm:block" />
          {(["all", "confirmed", "pending", "dismissed"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={cn(
                "rounded-full border px-2.5 py-1 text-xs font-medium capitalize transition-colors",
                status === s ? "border-accent/50 bg-accent/10 text-accent" : "border-border/60 text-muted-foreground hover:text-foreground",
              )}
            >
              {s}
            </button>
          ))}
        </div>

        {/* table */}
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
              {rows.map((d) => (
                <tr key={d.id} className="border-b border-border/40 transition-colors hover:bg-secondary/40">
                  <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{d.id}</td>
                  <td className="px-3 py-3 font-medium text-foreground">{d.object}</td>
                  <td className="px-3 py-3">
                    <span className="rounded border border-border/60 bg-secondary/40 px-2 py-0.5 text-xs text-muted-foreground">
                      {categoryLabel[d.category]}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-primary">{Math.round(d.confidence * 100)}%</span>
                      <span className="h-1 w-10 overflow-hidden rounded-full bg-secondary">
                        <span className="block h-full rounded-full bg-primary" style={{ width: `${d.confidence * 100}%` }} />
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-3 font-mono text-muted-foreground">{d.depth} m</td>
                  <td className="px-3 py-3 font-mono text-xs text-muted-foreground">
                    {d.gps.lat.toFixed(3)}, {d.gps.lng.toFixed(3)}
                  </td>
                  <td className="px-3 py-3">
                    <RiskBadge risk={d.risk} />
                  </td>
                  <td className="px-3 py-3">
                    <StatusPill label={d.status} tone={statusTone[d.status]} />
                  </td>
                  <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{d.mission}</td>
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
      <button onClick={onClick} className={cn("inline-flex items-center gap-1 transition-colors hover:text-foreground", active && "text-primary")}>
        {label}
        <ArrowUpDown className={cn("size-3", active && asc && "rotate-180")} />
      </button>
    </th>
  )
}
