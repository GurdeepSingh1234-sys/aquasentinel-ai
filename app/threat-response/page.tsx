"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Navigation, ShieldAlert, Route, MapPin, Cloud, Loader2, CheckCircle2, RefreshCw, XCircle } from "lucide-react"
import { Panel, PanelHeader } from "@/components/ui/panel"
import { RiskBadge } from "@/components/dashboard/risk-badge"
import { ThreatResponsePanel } from "@/components/dashboard/response-panel"
import { IntelligenceCard } from "@/components/dashboard/intelligence-card"
import { bboxEvidence, fuseEvidence } from "@/lib/aquafusion"
import { buildThreatResponse } from "@/lib/threat-response"
import type { Detection } from "@/lib/mock-data"
import { recordOperatorFeedback, subscribeToDetections } from "@/lib/firestore"
import { useAuth } from "@/components/auth/auth-provider"

const riskWeight: Record<Detection["risk"], number> = {
  critical: 1,
  high: 0.82,
  medium: 0.58,
  low: 0.32,
}

function chooseTarget(rows: Detection[]) {
  return [...rows]
    .sort((a, b) => {
      const riskDelta = riskWeight[b.risk] - riskWeight[a.risk]
      if (riskDelta !== 0) return riskDelta
      return b.confidence - a.confidence
    })[0] ?? null
}

function offsetStart(point: { lat: number; lng: number }) {
  return {
    lat: point.lat - 0.0011,
    lng: point.lng - 0.0013,
  }
}

export default function ThreatResponsePage() {
  const { user } = useAuth()
  const [detections, setDetections] = useState<Detection[]>([])
  const [selectedId, setSelectedId] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [feedback, setFeedback] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let active = true
    return subscribeToDetections(
      (rows) => {
        if (!active) return
        setDetections(rows)
        setLoading(false)
        setSelectedId((current) => current || chooseTarget(rows)?.id || "")
      },
      (subscriptionError) => {
        if (!active) return
        setError(subscriptionError.message || "Unable to load detections for threat response.")
        setLoading(false)
      },
    )
  }, [])

  const selected = useMemo(
    () => detections.find((detection) => detection.id === selectedId) ?? chooseTarget(detections),
    [detections, selectedId],
  )

  const intelligence = useMemo(() => {
    if (!selected) return null

    const evidence = bboxEvidence(selected.confidence, 0.16, 0.12)
    return fuseEvidence({
      modelConfidence: selected.confidence,
      shapeScore: evidence.shapeScore,
      shadowScore: evidence.shadowScore,
      contextScore: evidence.contextScore,
      repeatCount: selected.status === "confirmed" ? 2 : 1,
      temporalAgreement: selected.status === "confirmed" ? 0.88 : 0.62,
      knownClass: selected.category !== "unknown",
      hazardWeight: riskWeight[selected.risk],
      depth: selected.depth,
      proximityToRoute: selected.risk === "critical" || selected.risk === "high" ? 0.86 : 0.46,
    })
  }, [selected])

  const response = useMemo(() => {
    if (!selected) return null

    const target = selected.gps
    const start = offsetStart(target)
    const threats = detections
      .filter((detection) => detection.id !== selected.id && detection.risk !== "low")
      .map((detection) => ({
        id: detection.id,
        location: detection.gps,
        radiusMeters: detection.risk === "critical" ? 95 : detection.risk === "high" ? 70 : 45,
      }))

    return buildThreatResponse(
      start,
      target,
      threats,
    )
  }, [detections, selected])

  const candidateRows = useMemo(
    () =>
      [...detections]
        .sort((a, b) => {
          const riskDelta = riskWeight[b.risk] - riskWeight[a.risk]
          return riskDelta !== 0 ? riskDelta : b.confidence - a.confidence
        })
        .slice(0, 6),
    [detections],
  )

  const takeAction = async (action: "confirm" | "reject" | "rescan") => {
    if (!user || !selected || !intelligence) return

    setSaving(true)
    setFeedback("")
    try {
      await recordOperatorFeedback({
        uid: user.uid,
        detectionId: selected.id,
        action,
        state: intelligence.state,
        risk: intelligence.risk,
        confidence: intelligence.finalConfidence,
      })
      setFeedback(
        action === "confirm"
          ? `Operator confirmed ${selected.id} for response.`
          : action === "reject"
            ? `Operator rejected ${selected.id} and recorded the decision.`
            : `Rescan requested for ${selected.id}.`,
      )
    } catch (actionError) {
      setFeedback(actionError instanceof Error ? actionError.message : "Unable to save operator decision.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-72 items-center justify-center rounded-xl border border-border/60 bg-card/40">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin text-primary" />
          Loading live detections…
        </div>
      </div>
    )
  }

  if (!selected || !intelligence || !response) {
    return (
      <div className="rounded-xl border border-dashed border-border/60 bg-card/30 px-5 py-12 text-center text-sm text-muted-foreground">
        No detection is available to drive the Threat Response workflow.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Cloud className="size-4" />
          </span>
          <div>
            <p className="text-xs font-semibold text-foreground">Live AquaFusion Response</p>
            <p className="text-[11px] text-muted-foreground">
              Threat response is derived from the authenticated Firestore detection registry.
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 self-start rounded-full border border-success/25 bg-success/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide text-success sm:self-auto">
          <span className="size-1.5 animate-pulse rounded-full bg-success" />
          Connected
        </span>
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-xs text-destructive">
          {error}
        </div>
      ) : null}

      <Panel className="overflow-hidden">
        <div className="grid gap-6 p-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-destructive/25 bg-destructive/10 px-3 py-1 text-xs font-medium text-destructive">
              <ShieldAlert className="size-3.5" />
              LIVE RESPONSE
            </div>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              {selected.object} → operational response
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              AquaFusion converts the selected live detection into an evidence-based confidence, risk and response recommendation.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-4">
              <Metric label="Detection" value={selected.id} />
              <Metric label="Confidence" value={`${Math.round(intelligence.finalConfidence * 100)}%`} />
              <Metric label="Risk" value={intelligence.risk.toUpperCase()} />
              <Metric label="Priority" value={intelligence.priority.toUpperCase()} />
            </div>
          </div>

          <div className="rounded-xl border border-border/60 bg-secondary/30 p-5">
            <div className="flex items-center gap-2">
              <Navigation className="size-4 text-primary" />
              <p className="text-sm font-semibold text-foreground">Recommended action</p>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {response.note} Human review remains part of the decision loop.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href="/detection-map"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
              >
                <MapPin className="size-4" />
                Open Detection Map
              </Link>
              <span className="inline-flex items-center gap-2 rounded-lg border border-border/60 px-4 py-2 text-xs text-muted-foreground">
                <Route className="size-3.5" /> {response.route.length} waypoints
              </span>
            </div>
          </div>
        </div>
      </Panel>

      <Panel>
        <PanelHeader
          title="Response Candidate"
          subtitle="Select any live detection to recalculate AquaFusion intelligence"
          icon={<ShieldAlert className="size-4" />}
        />
        <div className="grid gap-2 p-5 sm:grid-cols-2 xl:grid-cols-3">
          {candidateRows.map((detection) => (
            <button
              key={detection.id}
              onClick={() => {
                setSelectedId(detection.id)
                setFeedback("")
              }}
              className={`rounded-lg border p-3 text-left transition-colors ${
                selected.id === detection.id
                  ? "border-primary/50 bg-primary/10"
                  : "border-border/60 bg-secondary/20 hover:bg-secondary/40"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[10px] text-muted-foreground">{detection.id}</span>
                <RiskBadge risk={detection.risk} />
              </div>
              <p className="mt-1 text-sm font-medium text-foreground">{detection.object}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {Math.round(detection.confidence * 100)}% model · {detection.depth} m · {detection.status}
              </p>
            </button>
          ))}
        </div>
      </Panel>

      <IntelligenceCard decision={intelligence} />
      <ThreatResponsePanel response={response} />

      <Panel>
        <PanelHeader
          title="Operator Decision Log"
          subtitle="Human-in-the-loop verification stored in Cloud Firestore"
          icon={<Navigation className="size-4" />}
        />
        <div className="p-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <ActionButton
              icon={<CheckCircle2 className="size-4" />}
              label="Confirm response"
              onClick={() => void takeAction("confirm")}
              disabled={saving}
            />
            <ActionButton
              icon={<RefreshCw className="size-4" />}
              label="Request rescan"
              onClick={() => void takeAction("rescan")}
              disabled={saving}
            />
            <ActionButton
              icon={<XCircle className="size-4" />}
              label="Reject alert"
              onClick={() => void takeAction("reject")}
              disabled={saving}
            />
          </div>
          {feedback ? (
            <div className="mt-3 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-muted-foreground">
              {feedback}
            </div>
          ) : null}
        </div>
      </Panel>

      <Panel>
        <PanelHeader title="AquaFusion flow" subtitle="DETECT → VERIFY → ASSESS → LOCATE → RESPOND" icon={<Route className="size-4" />} />
        <div className="grid gap-3 p-5 md:grid-cols-5">
          {[
            ["1", "Detect", "Live YOLO / sensor contact"],
            ["2", "Verify", "Evidence + temporal consistency"],
            ["3", "Assess", "Risk and priority score"],
            ["4", "Locate", "Threat zone + geo context"],
            ["5", "Respond", "Route + operator validation"],
          ].map(([step, title, description]) => (
            <div key={step} className="rounded-lg border border-border/60 bg-secondary/30 p-4">
              <span className="font-mono text-xs text-primary">STEP {step}</span>
              <p className="mt-1 text-sm font-medium text-foreground">{title}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/60 bg-card/60 p-3">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 font-mono text-sm font-semibold text-foreground">{value}</p>
    </div>
  )
}

function ActionButton({
  icon,
  label,
  onClick,
  disabled,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  disabled: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border/70 bg-card/70 px-4 text-sm font-medium text-foreground transition-colors hover:bg-secondary/60 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {icon}
      {disabled ? "Saving…" : label}
    </button>
  )
}
