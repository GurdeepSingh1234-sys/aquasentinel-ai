"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Image from "next/image"
import {
  Radar,
  Play,
  RotateCcw,
  Cpu,
  Crosshair,
  MapPin,
  Gauge,
  Layers,
  CheckCircle2,
  Loader2,
  Cloud,
  Database,
} from "lucide-react"
import { Panel, PanelHeader } from "@/components/ui/panel"
import { RiskBadge } from "@/components/dashboard/risk-badge"
import { cn } from "@/lib/utils"
import { sonarSamples, riskMeta, type BBox, type SonarSample } from "@/lib/mock-data"
import { persistSonarAnalysisResults } from "@/lib/firestore"

type Phase = "idle" | "analyzing" | "done"

const stages = [
  "Loading sonar tile & normalizing gain",
  "Removing water-column & nadir artifacts",
  "Running YOLO-Sonar v4 inference",
  "Classifying contacts & estimating depth",
  "Geo-referencing & scoring risk",
]

const boxColor: Record<string, string> = {
  critical: "border-destructive shadow-[0_0_0_1px_var(--destructive)]",
  high: "border-warning shadow-[0_0_0_1px_var(--warning)]",
  medium: "border-primary shadow-[0_0_0_1px_var(--primary)]",
  low: "border-success shadow-[0_0_0_1px_var(--success)]",
}

const boxLabelBg: Record<string, string> = {
  critical: "bg-destructive text-destructive-foreground",
  high: "bg-warning text-warning-foreground",
  medium: "bg-primary text-primary-foreground",
  low: "bg-success text-success-foreground",
}

export default function SonarAnalysisPage() {
  const [selected, setSelected] = useState<SonarSample>(sonarSamples[0])
  const [phase, setPhase] = useState<Phase>("idle")
  const [progress, setProgress] = useState(0)
  const [stage, setStage] = useState(0)
  const [revealed, setRevealed] = useState<BBox[]>([])
  const [active, setActive] = useState<string | null>(null)
  const [syncState, setSyncState] = useState<"idle" | "saving" | "saved" | "error">("idle")
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  const clearTimers = () => {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }

  const reset = useCallback(() => {
    clearTimers()
    setPhase("idle")
    setProgress(0)
    setStage(0)
    setRevealed([])
    setActive(null)
    setSyncState("idle")
  }, [])

  const selectSample = (sample: SonarSample) => {
    if (sample.id === selected.id) return
    reset()
    setSelected(sample)
  }

  const analyze = () => {
    if (phase === "analyzing") return

    clearTimers()
    setPhase("analyzing")
    setProgress(0)
    setStage(0)
    setRevealed([])
    setActive(null)
    setSyncState("idle")

    const duration = 3200
    const start = Date.now()
    const interval = setInterval(() => {
      const percent = Math.min(100, ((Date.now() - start) / duration) * 100)
      setProgress(percent)
      setStage(Math.min(stages.length - 1, Math.floor((percent / 100) * stages.length)))
      if (percent >= 100) clearInterval(interval)
    }, 40)

    timers.current.push(interval as unknown as ReturnType<typeof setTimeout>)

    selected.boxes.forEach((box, index) => {
      const timer = setTimeout(
        () => setRevealed((previous) => [...previous, box]),
        duration + 250 + index * 400,
      )
      timers.current.push(timer)
    })

    const done = setTimeout(async () => {
      setPhase("done")
      setSyncState("saving")

      try {
        await persistSonarAnalysisResults(selected.id, selected.boxes)
        setSyncState("saved")
      } catch {
        setSyncState("error")
      }
    }, duration + 250 + selected.boxes.length * 400 + 200)

    timers.current.push(done)
  }

  useEffect(() => clearTimers, [])

  const showBoxes = phase === "done" || (phase === "analyzing" && revealed.length > 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Cloud className="size-4" />
          </span>
          <div>
            <p className="text-xs font-semibold text-foreground">Sonar Analysis → Firestore</p>
            <p className="text-[11px] text-muted-foreground">
              Completed analysis results are persisted to the authenticated detection registry.
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 self-start rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide text-primary sm:self-auto">
          <span className="size-1.5 animate-pulse rounded-full bg-primary" />
          {syncState === "saved" ? "Results synced" : "Analysis ready"}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-1">
          <Panel>
            <PanelHeader title="Sample Imagery" subtitle="Select a Side-Scan Sonar tile" icon={<Layers className="size-4" />} />
            <div className="space-y-3 p-4">
              {sonarSamples.map((sample) => (
                <button
                  key={sample.id}
                  onClick={() => selectSample(sample)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg border p-2 text-left transition-colors",
                    selected.id === sample.id
                      ? "border-primary/50 bg-primary/10"
                      : "border-border/60 bg-card/60 hover:bg-secondary/50",
                  )}
                >
                  <div className="relative size-14 shrink-0 overflow-hidden rounded-md border border-border/60">
                    <Image src={sample.src || "/placeholder.svg"} alt={sample.name} fill sizes="56px" className="object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{sample.name}</p>
                    <p className="truncate font-mono text-[11px] text-muted-foreground">
                      {sample.id} · {sample.depthRange}
                    </p>
                  </div>
                  {selected.id === sample.id ? <span className="size-2 rounded-full bg-primary" /> : null}
                </button>
              ))}
            </div>
          </Panel>

          <Panel>
            <PanelHeader title="Inference Control" subtitle="YOLO-Sonar v4 · 640px" icon={<Cpu className="size-4" />} />
            <div className="space-y-4 p-5">
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="rounded-lg border border-border/60 bg-secondary/40 p-3">
                  <p className="font-mono text-lg font-semibold text-primary">{selected.resolution}</p>
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Resolution</p>
                </div>
                <div className="rounded-lg border border-border/60 bg-secondary/40 p-3">
                  <p className="font-mono text-lg font-semibold text-primary">0.45</p>
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Conf. Thresh</p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={analyze}
                  disabled={phase === "analyzing"}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
                >
                  {phase === "analyzing" ? (
                    <>
                      <Loader2 className="size-4 animate-spin" /> Analyzing…
                    </>
                  ) : (
                    <>
                      <Play className="size-4" /> Analyze
                    </>
                  )}
                </button>

                <button
                  onClick={reset}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-border/70 bg-card/60 px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary/60"
                  aria-label="Reset"
                >
                  <RotateCcw className="size-4" />
                </button>
              </div>

              {phase !== "idle" ? (
                <div className="space-y-2 rounded-lg border border-border/60 bg-secondary/30 p-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-muted-foreground">PROCESSING</span>
                    <span className="font-mono text-primary">{Math.round(progress)}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
                  </div>
                  <ul className="space-y-1 pt-1">
                    {stages.map((stageName, index) => {
                      const state = phase === "done" || index < stage ? "done" : index === stage ? "active" : "pending"
                      return (
                        <li key={stageName} className="flex items-center gap-2 text-xs">
                          {state === "done" ? (
                            <CheckCircle2 className="size-3.5 text-success" />
                          ) : state === "active" ? (
                            <Loader2 className="size-3.5 animate-spin text-primary" />
                          ) : (
                            <span className="size-3.5 rounded-full border border-border" />
                          )}
                          <span className={cn(state === "pending" ? "text-muted-foreground" : "text-foreground")}>{stageName}</span>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ) : (
                <p className="rounded-lg border border-dashed border-border/60 p-3 text-center text-xs text-muted-foreground">
                  Select a tile and run inference to detect underwater debris and anomalies.
                </p>
              )}
            </div>
          </Panel>
        </div>

        <div className="space-y-6 xl:col-span-2">
          <Panel className="overflow-hidden">
            <PanelHeader
              title={selected.name}
              subtitle={`${selected.id} · ${selected.location}`}
              icon={<Radar className="size-4" />}
              action={
                phase === "done" ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">
                    <CheckCircle2 className="size-3" /> {revealed.length} contacts
                  </span>
                ) : null
              }
            />
            <div className="relative aspect-[2/1] w-full overflow-hidden bg-black">
              <Image
                src={selected.src || "/placeholder.svg"}
                alt={`Side-scan sonar tile ${selected.name}`}
                fill
                sizes="(max-width: 1280px) 100vw, 66vw"
                className="object-cover"
                priority
              />

              {phase === "analyzing" ? (
                <>
                  <div className="absolute inset-0 bg-primary/5" />
                  <div
                    className="absolute inset-x-0 h-0.5 bg-primary shadow-[0_0_20px_4px_var(--primary)]"
                    style={{ top: `${progress}%` }}
                  />
                  <div className="absolute left-3 top-3 rounded-md bg-background/70 px-2 py-1 font-mono text-[10px] text-primary backdrop-blur">
                    SCANNING · {Math.round(progress)}%
                  </div>
                </>
              ) : null}

              {showBoxes
                ? revealed.map((box) => (
                    <button
                      key={box.id}
                      onMouseEnter={() => setActive(box.id)}
                      onMouseLeave={() => setActive(null)}
                      onFocus={() => setActive(box.id)}
                      onClick={() => setActive(box.id)}
                      className={cn(
                        "group absolute rounded border-2 transition-all",
                        boxColor[box.risk],
                        active && active !== box.id ? "opacity-50" : "opacity-100",
                      )}
                      style={{
                        left: `${box.x * 100}%`,
                        top: `${box.y * 100}%`,
                        width: `${box.w * 100}%`,
                        height: `${box.h * 100}%`,
                      }}
                    >
                      <span
                        className={cn(
                          "absolute -top-5 left-0 whitespace-nowrap rounded px-1.5 py-0.5 font-mono text-[10px] font-medium",
                          boxLabelBg[box.risk],
                        )}
                      >
                        {box.label} {Math.round(box.confidence * 100)}%
                      </span>
                      <Crosshair className="absolute left-1/2 top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 text-current opacity-0 group-hover:opacity-100" />
                    </button>
                  ))
                : null}

              {phase === "idle" ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="rounded-lg border border-primary/30 bg-background/70 px-4 py-2 text-center text-xs text-muted-foreground backdrop-blur">
                    Press <span className="font-medium text-primary">Analyze</span> to run AI detection
                  </div>
                </div>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-border/60 px-5 py-3 font-mono text-[11px] text-muted-foreground">
              <span>DEPTH {selected.depthRange}</span>
              <span>GPS {selected.location}</span>
              <span>FREQ 900 kHz</span>
              <span>RANGE 50 m</span>
            </div>
          </Panel>

          {syncState === "saved" ? (
            <div className="flex items-center gap-2 rounded-xl border border-success/25 bg-success/10 px-4 py-3 text-xs text-success">
              <Database className="size-4" />
              Analysis results have been synchronized to Firestore and are now available in Detections, the map and AquaFusion.
            </div>
          ) : null}

          {syncState === "saving" ? (
            <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-xs text-muted-foreground">
              <Loader2 className="size-4 animate-spin text-primary" />
              Saving detected contacts to Firestore…
            </div>
          ) : null}

          {syncState === "error" ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-xs text-destructive">
              Analysis completed, but the detected contacts could not be synchronized to Firestore.
            </div>
          ) : null}

          <Panel>
            <PanelHeader
              title="Detected Objects"
              subtitle="AI-classified contacts with geolocation & risk"
              icon={<Crosshair className="size-4" />}
            />
            {phase === "done" || revealed.length > 0 ? (
              <div className="divide-y divide-border/50">
                {revealed.map((box) => (
                  <div
                    key={box.id}
                    onMouseEnter={() => setActive(box.id)}
                    onMouseLeave={() => setActive(null)}
                    className={cn(
                      "grid grid-cols-2 gap-3 px-5 py-4 transition-colors sm:grid-cols-5 sm:items-center",
                      active === box.id ? "bg-primary/5" : "",
                    )}
                  >
                    <div className="col-span-2 sm:col-span-1">
                      <div className="flex items-center gap-2">
                        <span className={cn("size-2.5 rounded-sm", riskMeta[box.risk].dot)} />
                        <p className="text-sm font-medium text-foreground">{box.label}</p>
                      </div>
                      <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">{box.id.toUpperCase()}</p>
                    </div>
                    <Metric icon={<Gauge className="size-3.5" />} label="Confidence" value={`${Math.round(box.confidence * 100)}%`} />
                    <Metric icon={<Layers className="size-3.5" />} label="Depth" value={`${box.depth} m`} />
                    <Metric
                      icon={<MapPin className="size-3.5" />}
                      label="GPS"
                      value={`${box.gps.lat.toFixed(4)}, ${box.gps.lng.toFixed(4)}`}
                    />
                    <div className="flex sm:justify-end">
                      <RiskBadge risk={box.risk} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 p-10 text-center">
                <div className="flex size-12 items-center justify-center rounded-full border border-border/60 bg-secondary/40 text-muted-foreground">
                  <Crosshair className="size-5" />
                </div>
                <p className="text-sm text-muted-foreground">No detections yet</p>
                <p className="text-xs text-muted-foreground">Run analysis to populate classified contacts.</p>
              </div>
            )}
          </Panel>
        </div>
      </div>
    </div>
  )
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <p className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground">
        {icon} {label}
      </p>
      <p className="mt-0.5 font-mono text-sm text-foreground">{value}</p>
    </div>
  )
}
