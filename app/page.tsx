import Link from "next/link"
import {
  Waves,
  ScanSearch,
  ShieldAlert,
  Gauge,
  Radar,
  ArrowRight,
  Activity,
  MapPin,
} from "lucide-react"
import { Panel, PanelHeader } from "@/components/ui/panel"
import { StatCard } from "@/components/dashboard/stat-card"
import { SonarScope } from "@/components/dashboard/sonar-scope"
import { RiskBadge } from "@/components/dashboard/risk-badge"
import { ActivityBars, GroupedBars, Meter } from "@/components/charts/mini-charts"
import {
  detections,
  riskDistribution,
  riskMeta,
  sonarActivity,
  detectionTrend,
} from "@/lib/mock-data"

export default function OverviewPage() {
  const totalRisk = riskDistribution.reduce((s, r) => s + r.count, 0)
  const recent = detections.slice(0, 5)

  return (
    <div className="space-y-6">
      {/* Hero banner */}
      <Panel className="grid-sonar relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-card via-card/70 to-transparent" />
        <div className="relative flex flex-col items-start justify-between gap-6 p-6 sm:flex-row sm:items-center">
          <div className="max-w-xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary/60" />
                <span className="relative inline-flex size-2 rounded-full bg-primary" />
              </span>
              Live surveillance active · SIH26057
            </div>
            <h2 className="text-balance text-2xl font-semibold tracking-tight text-foreground">
              Autonomous marine debris & anomaly detection
            </h2>
            <p className="mt-2 text-pretty text-sm text-muted-foreground">
              AquaSentinel AI continuously analyzes Side-Scan Sonar imagery across the survey fleet, classifying
              underwater debris, hazards and anomalies in near real-time.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/sonar-analysis"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <Radar className="size-4" />
                Run Sonar Analysis
              </Link>
              <Link
                href="/detection-map"
                className="inline-flex items-center gap-2 rounded-lg border border-border/70 bg-card/60 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary/60"
              >
                <MapPin className="size-4" />
                View Detection Map
              </Link>
            </div>
          </div>
          <div className="w-40 shrink-0 sm:w-52">
            <SonarScope />
          </div>
        </div>
      </Panel>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Sonar Coverage"
          value="128.4"
          unit="km²"
          icon={<Waves className="size-5" />}
          delta="12.6%"
          deltaTone="up"
          footer={
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Today</span>
              <span className="font-mono text-primary">2 active sweeps</span>
            </div>
          }
        />
        <StatCard
          label="Total Detections"
          value="145"
          icon={<ScanSearch className="size-5" />}
          delta="8.3%"
          deltaTone="up"
          footer={
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Confirmed</span>
              <span className="font-mono text-success">112 verified</span>
            </div>
          }
        />
        <StatCard
          label="Critical Hazards"
          value="14"
          icon={<ShieldAlert className="size-5" />}
          delta="3.1%"
          deltaTone="down"
          footer={
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Requires action</span>
              <span className="font-mono text-destructive">5 new</span>
            </div>
          }
        />
        <StatCard
          label="Model Accuracy"
          value="96.2"
          unit="%"
          icon={<Gauge className="size-5" />}
          delta="0.4%"
          deltaTone="up"
          footer={
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>YOLO-Sonar v4</span>
              <span className="font-mono text-primary">18ms / frame</span>
            </div>
          }
        />
      </div>

      {/* Middle grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Sonar activity */}
        <Panel className="lg:col-span-2">
          <PanelHeader
            title="Sonar Activity"
            subtitle="Acoustic return intensity · last 24 hours"
            icon={<Activity className="size-4" />}
            action={
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-2 rounded-sm bg-primary" /> Intensity
                </span>
              </div>
            }
          />
          <div className="p-5">
            <div className="h-44">
              <ActivityBars data={sonarActivity} />
            </div>
            <div className="mt-3 flex justify-between font-mono text-[10px] text-muted-foreground">
              <span>00:00</span>
              <span>06:00</span>
              <span>12:00</span>
              <span>18:00</span>
              <span>23:00</span>
            </div>
          </div>
        </Panel>

        {/* Risk levels */}
        <Panel>
          <PanelHeader title="Risk Levels" subtitle="Active detection classification" icon={<ShieldAlert className="size-4" />} />
          <div className="space-y-4 p-5">
            {riskDistribution.map((r) => {
              const pct = Math.round((r.count / totalRisk) * 100)
              const tone =
                r.risk === "critical"
                  ? "destructive"
                  : r.risk === "high"
                    ? "warning"
                    : r.risk === "medium"
                      ? "primary"
                      : "success"
              return (
                <div key={r.risk}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span className={`size-2 rounded-full ${riskMeta[r.risk].dot}`} />
                      <span className="capitalize text-foreground">{r.risk}</span>
                    </span>
                    <span className="font-mono text-muted-foreground">
                      {r.count} <span className="text-xs">({pct}%)</span>
                    </span>
                  </div>
                  <Meter value={pct} tone={tone as "destructive" | "warning" | "primary" | "success"} />
                </div>
              )
            })}
            <div className="mt-2 rounded-lg border border-border/60 bg-secondary/40 p-3 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Highest concentration</span> detected in Harbour Approach —
              Sector 7.
            </div>
          </div>
        </Panel>
      </div>

      {/* Bottom grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Detection trend */}
        <Panel className="lg:col-span-1">
          <PanelHeader title="Detection Trend" subtitle="Debris vs. hazards · 7 days" icon={<Activity className="size-4" />} />
          <div className="p-5">
            <div className="h-52">
              <GroupedBars data={detectionTrend} />
            </div>
            <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-sm bg-primary" /> Debris
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-sm bg-warning" /> Hazards
              </span>
            </div>
          </div>
        </Panel>

        {/* Recent detections */}
        <Panel className="lg:col-span-2">
          <PanelHeader
            title="Recent Detections"
            subtitle="Latest classified sonar contacts"
            icon={<ScanSearch className="size-4" />}
            action={
              <Link href="/detections" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                View all <ArrowRight className="size-3" />
              </Link>
            }
          />
          <div className="divide-y divide-border/50">
            {recent.map((d) => (
              <div key={d.id} className="flex items-center gap-4 px-5 py-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-secondary/50 font-mono text-[10px] text-muted-foreground">
                  {d.id.split("-")[1]}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{d.object}</p>
                  <p className="truncate font-mono text-xs text-muted-foreground">
                    {d.gps.lat.toFixed(4)}, {d.gps.lng.toFixed(4)} · {d.depth} m
                  </p>
                </div>
                <div className="hidden text-right sm:block">
                  <p className="font-mono text-sm text-primary">{Math.round(d.confidence * 100)}%</p>
                  <p className="text-[10px] text-muted-foreground">confidence</p>
                </div>
                <RiskBadge risk={d.risk} />
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  )
}
