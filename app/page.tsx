"use client"

import { useEffect, useMemo, useState } from "react"
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
  Cloud,
  Loader2,
} from "lucide-react"
import { Panel, PanelHeader } from "@/components/ui/panel"
import { StatCard } from "@/components/dashboard/stat-card"
import { SonarScope } from "@/components/dashboard/sonar-scope"
import { RiskBadge } from "@/components/dashboard/risk-badge"
import { ActivityBars, GroupedBars, Meter } from "@/components/charts/mini-charts"
import { riskMeta, sonarActivity, detectionTrend, type Detection, type Risk } from "@/lib/mock-data"
import { subscribeToDetections, subscribeToMissions } from "@/lib/firestore"

export default function OverviewPage() {
  const [detections, setDetections] = useState<Detection[]>([])
  const [missionCoverage, setMissionCoverage] = useState(0)
  const [activeSweeps, setActiveSweeps] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let active = true

    const unsubscribeDetections = subscribeToDetections(
      (rows) => {
        if (!active) return
        setDetections(rows)
        setLoading(false)
      },
      (subscriptionError) => {
        if (!active) return
        setError(subscriptionError.message || "Unable to load dashboard detections.")
        setLoading(false)
      },
    )

    const unsubscribeMissions = subscribeToMissions(
      (rows) => {
        if (!active) return
        setMissionCoverage(rows.reduce((sum, mission) => sum + mission.coverage, 0))
        setActiveSweeps(rows.filter((mission) => mission.status === "active").length)
      },
      (subscriptionError) => {
        if (!active) return
        setError(subscriptionError.message || "Unable to load dashboard missions.")
      },
    )

    return () => {
      active = false
      unsubscribeDetections()
      unsubscribeMissions()
    }
  }, [])

  const recent = detections.slice(0, 5)

  const riskDistribution = useMemo(
    () =>
      (["critical", "high", "medium", "low"] as Risk[]).map((risk) => ({
        risk,
        count: detections.filter((detection) => detection.risk === risk).length,
      })),
    [detections],
  )

  const totalDetections = detections.length
  const confirmedDetections = detections.filter((detection) => detection.status === "confirmed").length
  const criticalHazards = detections.filter(
    (detection) => detection.risk === "critical" && detection.status !== "dismissed",
  ).length
  const totalRisk = Math.max(totalDetections, 1)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Cloud className="size-4" />
          </span>
          <div>
            <p className="text-xs font-semibold text-foreground">Live Firestore Command Data</p>
            <p className="text-[11px] text-muted-foreground">
              Dashboard metrics are synchronized with authenticated mission and detection data.
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
          Dashboard data error: {error}
        </div>
      ) : null}

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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Sonar Coverage"
          value={loading ? "—" : missionCoverage.toFixed(1)}
          unit="km²"
          icon={<Waves className="size-5" />}
          delta="Live"
          deltaTone="up"
          footer={
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Mission registry</span>
              <span className="font-mono text-primary">{activeSweeps} active sweeps</span>
            </div>
          }
        />
        <StatCard
          label="Total Detections"
          value={loading ? "—" : String(totalDetections)}
          icon={<ScanSearch className="size-5" />}
          delta="Live"
          deltaTone="up"
          footer={
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Confirmed</span>
              <span className="font-mono text-success">{confirmedDetections} verified</span>
            </div>
          }
        />
        <StatCard
          label="Critical Hazards"
          value={loading ? "—" : String(criticalHazards)}
          icon={<ShieldAlert className="size-5" />}
          delta="Live"
          deltaTone="down"
          footer={
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Current registry</span>
              <span className="font-mono text-destructive">
                {criticalHazards > 0 ? "Attention" : "None"}
              </span>
            </div>
          }
        />
        <StatCard
          label="Model Accuracy"
          value="96.2"
          unit="%"
          icon={<Gauge className="size-5" />}
          delta="Prototype"
          deltaTone="up"
          footer={
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>YOLO-Sonar v4</span>
              <span className="font-mono text-primary">18ms / frame</span>
            </div>
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
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

        <Panel>
          <PanelHeader title="Risk Levels" subtitle="Live detection classification" icon={<ShieldAlert className="size-4" />} />
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
              <span className="font-medium text-foreground">Data source</span> Live Firestore detection registry.
            </div>
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
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
          {loading ? (
            <div className="flex min-h-48 items-center justify-center text-sm text-muted-foreground">
              <Loader2 className="mr-2 size-4 animate-spin text-primary" />
              Syncing detection registry…
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {recent.map((detection) => (
                <div key={detection.id} className="flex items-center gap-4 px-5 py-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-secondary/50 font-mono text-[10px] text-muted-foreground">
                    {detection.id.split("-")[1]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{detection.object}</p>
                    <p className="truncate font-mono text-xs text-muted-foreground">
                      {detection.gps.lat.toFixed(4)}, {detection.gps.lng.toFixed(4)} · {detection.depth} m
                    </p>
                  </div>
                  <div className="hidden text-right sm:block">
                    <p className="font-mono text-sm text-primary">{Math.round(detection.confidence * 100)}%</p>
                    <p className="text-[10px] text-muted-foreground">confidence</p>
                  </div>
                  <RiskBadge risk={detection.risk} />
                </div>
              ))}
              {recent.length === 0 ? (
                <div className="px-5 py-12 text-center text-sm text-muted-foreground">
                  No detection records available.
                </div>
              ) : null}
            </div>
          )}
        </Panel>
      </div>
    </div>
  )
}
