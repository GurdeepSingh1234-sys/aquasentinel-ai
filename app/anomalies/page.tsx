"use client"

import { useMemo, useState } from "react"
import { TriangleAlert, Waves, Activity, Radio, ThermometerSun, Magnet } from "lucide-react"
import { Panel, PanelHeader } from "@/components/ui/panel"
import { RiskBadge, StatusPill } from "@/components/dashboard/risk-badge"
import { cn } from "@/lib/utils"
import { anomalies, type Anomaly } from "@/lib/mock-data"

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

  const rows = useMemo(() => (tab === "all" ? anomalies : anomalies.filter((a) => a.status === tab)), [tab])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Active Anomalies", value: anomalies.filter((a) => a.status !== "resolved").length, tone: "text-warning" },
          { label: "Investigating", value: anomalies.filter((a) => a.status === "investigating").length, tone: "text-primary" },
          { label: "Critical", value: anomalies.filter((a) => a.severity === "critical").length, tone: "text-destructive" },
          { label: "Resolved (7d)", value: anomalies.filter((a) => a.status === "resolved").length, tone: "text-success" },
        ].map((s) => (
          <Panel key={s.label} className="p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{s.label}</p>
            <p className={cn("mt-1 font-mono text-2xl font-semibold", s.tone)}>{s.value}</p>
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
              {(["all", "new", "investigating", "resolved"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-xs font-medium capitalize transition-colors",
                    tab === t ? "border-primary/50 bg-primary/10 text-primary" : "border-border/60 text-muted-foreground hover:text-foreground",
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          }
        />
        <div className="divide-y divide-border/50">
          {rows.map((a) => (
            <div key={a.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-start">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
                {typeIcon[a.type] ?? <TriangleAlert className="size-4" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-foreground">{a.type}</p>
                  <span className="font-mono text-[11px] text-muted-foreground">{a.id}</span>
                  <RiskBadge risk={a.severity} />
                  <StatusPill label={a.status} tone={statusTone[a.status]} />
                </div>
                <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">{a.description}</p>
                <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 font-mono text-[11px] text-muted-foreground">
                  <span>LOC {a.location}</span>
                  <span>CONF {Math.round(a.confidence * 100)}%</span>
                  <span>{a.detectedAt}</span>
                </div>
              </div>
              <button className="self-start rounded-lg border border-border/70 bg-card/60 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary/60">
                Investigate
              </button>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  )
}
