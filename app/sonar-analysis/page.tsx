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
} from "lucide-react"
import { Panel, PanelHeader } from "@/components/ui/panel"
import { RiskBadge } from "@/components/dashboard/risk-badge"
import { cn } from "@/lib/utils"
import { sonarSamples, riskMeta, type BBox, type SonarSample } from "@/lib/mock-data"

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
  }, [])

  const selectSample = (s: SonarSample) => {
    if (s.id === selected.id) return
    reset()
    setSelected(s)
  }

  const analyze = () => {
    if (phase === "analyzing") return
    clearTimers()
    setPhase("analyzing")
    setProgress(0)
    setStage(0)
    setRevealed([])
    setActive(null)

    const duration = 3200
    const start = Date.now()
    const interval = setInterval(() => {
      const p = Math.min(100, ((Date.now() - start) / duration) * 100)
      setProgress(p)
      setStage(Math.min(stages.length - 1, Math.floor((p / 100) * stages.length)))
      if (p >= 100) clearInterval(interval)
    }, 40)
    timers.current.push(interval as unknown as ReturnType<typeof setTimeout>)

    // reveal boxes progressively
    selected.boxes.forEach((b, i) => {
      const t = setTimeout(
        () => setRevealed((prev) => [...prev, b]),
        duration + 250 + i * 400,
      )
      timers.current.push(t)
    })
    const done = setTimeout(() => setPhase("done"), duration + 250 + selected.boxes.length * 400 + 200)
    timers.current.push(done)
  }

  useEffect(() => clearTimers, [])

  const showBoxes = phase === "done" || (phase === "analyzing" && revealed.length > 0)

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
      {/* Left: samples + controls */}
      <div className="space-y-6 xl:col-span-1">
        <Panel>
          <PanelHeader title="Sample Imagery" subtitle="Select a Side-Scan Sonar tile" icon={<Layers className="size-4" />} />
          <div className="space-y-3 p-4">
            {sonarSamples.map((s) => (
              <button
                key={s.id}
                onClick={() => selectSample(s)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg border p-2 text-left transition-colors",
                  selected.id === s.id
                    ? "border-primary/50 bg-primary/10"
                    : "border-border/60 bg-card/60 hover:bg-secondary/50",
                )}
              >
                <div className="relative size-14 shrink-0 overflow-hidden rounded-md border border-border/60">
                  <Image src={s.src || "/placeholder.svg"} alt={s.name} fill sizes="56px" className="object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{s.name}</p>
                  <p className="truncate font-mono text-[11px] text-muted-foreground">
                    {s.id} · {s.depthRange}
                  </p>
                </div>
                {selected.id === s.id ? <span className="size-2 rounded-full bg-primary" /> : null}
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

            {/* processing log */}
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
                  {stages.map((s, i) => {
                    const state = phase === "done" || i < stage ? "done" : i === stage ? "active" : "pending"
                    return (
                      <li key={s} className="flex items-center gap-2 text-xs">
                        {state === "done" ? (
                          <CheckCircle2 className="size-3.5 text-success" />
                        ) : state === "active" ? (
                          <Loader2 className="size-3.5 animate-spin text-primary" />
                        ) : (
                          <span className="size-3.5 rounded-full border border-border" />
                        )}
                        <span className={cn(state === "pending" ? "text-muted-foreground" : "text-foreground")}>{s}</span>
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

      {/* Right: viewer + results */}
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
            {/* scanning overlay */}
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

            {/* bounding boxes */}
            {showBoxes
              ? revealed.map((b) => (
                  <button
                    key={b.id}
                    onMouseEnter={() => setActive(b.id)}
                    onMouseLeave={() => setActive(null)}
                    onFocus={() => setActive(b.id)}
                    onClick={() => setActive(b.id)}
                    className={cn(
                      "group absolute rounded border-2 transition-all",
                      boxColor[b.risk],
                      active && active !== b.id ? "opacity-50" : "opacity-100",
                    )}
                    style={{
                      left: `${b.x * 100}%`,
                      top: `${b.y * 100}%`,
                      width: `${b.w * 100}%`,
                      height: `${b.h * 100}%`,
                    }}
                  >
                    <span
                      className={cn(
                        "absolute -top-5 left-0 whitespace-nowrap rounded px-1.5 py-0.5 font-mono text-[10px] font-medium",
                        boxLabelBg[b.risk],
                      )}
                    >
                      {b.label} {Math.round(b.confidence * 100)}%
                    </span>
                    <Crosshair className="absolute left-1/2 top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 text-current opacity-0 group-hover:opacity-100" />
                  </button>
                ))
              : null}

            {/* idle hint */}
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

        {/* Detected objects */}
        <Panel>
          <PanelHeader
            title="Detected Objects"
            subtitle="AI-classified contacts with geolocation & risk"
            icon={<Crosshair className="size-4" />}
          />
          {phase === "done" || revealed.length > 0 ? (
            <div className="divide-y divide-border/50">
              {revealed.map((b) => (
                <div
                  key={b.id}
                  onMouseEnter={() => setActive(b.id)}
                  onMouseLeave={() => setActive(null)}
                  className={cn(
                    "grid grid-cols-2 gap-3 px-5 py-4 transition-colors sm:grid-cols-5 sm:items-center",
                    active === b.id ? "bg-primary/5" : "",
                  )}
                >
                  <div className="col-span-2 sm:col-span-1">
                    <div className="flex items-center gap-2">
                      <span className={cn("size-2.5 rounded-sm", riskMeta[b.risk].dot)} />
                      <p className="text-sm font-medium text-foreground">{b.label}</p>
                    </div>
                    <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">{b.id.toUpperCase()}</p>
                  </div>
                  <Metric icon={<Gauge className="size-3.5" />} label="Confidence" value={`${Math.round(b.confidence * 100)}%`} />
                  <Metric icon={<Layers className="size-3.5" />} label="Depth" value={`${b.depth} m`} />
                  <Metric
                    icon={<MapPin className="size-3.5" />}
                    label="GPS"
                    value={`${b.gps.lat.toFixed(4)}, ${b.gps.lng.toFixed(4)}`}
                  />
                  <div className="flex sm:justify-end">
                    <RiskBadge risk={b.risk} />
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
