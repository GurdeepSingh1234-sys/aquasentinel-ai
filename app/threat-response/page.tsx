"use client"

import Link from "next/link"
import { Navigation, ShieldAlert, Route, MapPin } from "lucide-react"
import { Panel, PanelHeader } from "@/components/ui/panel"
import { RiskBadge } from "@/components/dashboard/risk-badge"
import { ThreatResponsePanel } from "@/components/dashboard/response-panel"
import { IntelligenceCard } from "@/components/dashboard/intelligence-card"
import { fuseEvidence } from "@/lib/aquafusion"
import { buildThreatResponse } from "@/lib/threat-response"

const decision = fuseEvidence({
  modelConfidence: 0.94,
  shapeScore: 0.88,
  shadowScore: 0.9,
  contextScore: 0.86,
  repeatCount: 3,
  temporalAgreement: 0.94,
  knownClass: true,
  hazardWeight: 0.98,
  depth: 18,
  proximityToRoute: 0.9,
})

const response = buildThreatResponse(
  { lat: 12.9139, lng: 74.8557 },
  { lat: 12.9145, lng: 74.8564 },
  [
    {
      id: "DET-9015",
      location: { lat: 12.9145, lng: 74.8564 },
      radiusMeters: 95,
    },
  ],
)

export default function ThreatResponsePage() {
  return (
    <div className="space-y-6">
      <Panel className="overflow-hidden">
        <div className="grid gap-6 p-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-destructive/25 bg-destructive/10 px-3 py-1 text-xs font-medium text-destructive">
              <ShieldAlert className="size-3.5" />
              LIVE RESPONSE SCENARIO
            </div>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              Ghost-net candidate → operational response
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              AquaFusion combines model confidence, evidence consistency and repeated observations before
              assigning risk and generating the next inspection action.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-4">
              <Metric label="Detection" value="Ghost Net" />
              <Metric label="Confidence" value="94%" />
              <Metric label="Risk" value={decision.risk.toUpperCase()} />
              <Metric label="Priority" value={decision.priority.toUpperCase()} />
            </div>
          </div>

          <div className="rounded-xl border border-border/60 bg-secondary/30 p-5">
            <div className="flex items-center gap-2">
              <Navigation className="size-4 text-primary" />
              <p className="text-sm font-semibold text-foreground">Recommended action</p>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Create a protected inspection corridor, notify the operator and approach the target using the
              generated detour rather than a direct route.
            </p>
            <div className="mt-4 flex gap-2">
              <Link
                href="/detection-map"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
              >
                <MapPin className="size-4" />
                Open Detection Map
              </Link>
              <span className="inline-flex items-center gap-2 rounded-lg border border-border/60 px-4 py-2 text-xs text-muted-foreground">
                <Route className="size-3.5" /> Route generated
              </span>
            </div>
          </div>
        </div>
      </Panel>

      <IntelligenceCard decision={decision} />
      <ThreatResponsePanel response={response} />

      <Panel>
        <PanelHeader title="Operator Decision Log" subtitle="Human-in-the-loop verification" icon={<Navigation className="size-4" />} />
        <div className="grid gap-3 p-5 md:grid-cols-3">
          {[
            ["1", "AI detects candidate", "YOLO contact + evidence fusion"],
            ["2", "System prioritizes", "Risk and temporal consistency"],
            ["3", "Operator validates", "Confirm, reject or request rescan"],
          ].map(([step, title, text]) => (
            <div key={step} className="rounded-lg border border-border/60 bg-secondary/30 p-4">
              <span className="font-mono text-xs text-primary">STEP {step}</span>
              <p className="mt-1 text-sm font-medium text-foreground">{title}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{text}</p>
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
