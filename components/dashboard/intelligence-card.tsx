import { Gauge, ShieldAlert, BrainCircuit, History } from "lucide-react"
import { Panel } from "@/components/ui/panel"
import { RiskBadge } from "@/components/dashboard/risk-badge"
import type { IntelligenceDecision } from "@/lib/aquafusion"

export function IntelligenceCard({
  decision,
  title = "AquaFusion Intelligence",
}: {
  decision: IntelligenceDecision
  title?: string
}) {
  const bars = [
    ["Model", decision.evidence.model],
    ["Shape", decision.evidence.shape],
    ["Shadow", decision.evidence.shadow],
    ["Context", decision.evidence.context],
    ["Temporal", decision.evidence.temporal],
  ] as const

  return (
    <Panel>
      <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
        <div className="flex items-center gap-2">
          <BrainCircuit className="size-4 text-primary" />
          <div>
            <p className="text-sm font-semibold text-foreground">{title}</p>
            <p className="text-[11px] text-muted-foreground">Evidence + temporal + risk decision layer</p>
          </div>
        </div>
        <RiskBadge risk={decision.risk} />
      </div>

      <div className="grid gap-4 p-5 sm:grid-cols-3">
        <div className="rounded-lg border border-border/60 bg-secondary/30 p-3">
          <p className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground">
            <Gauge className="size-3" /> Final confidence
          </p>
          <p className="mt-1 font-mono text-2xl font-semibold text-primary">
            {Math.round(decision.finalConfidence * 100)}%
          </p>
        </div>
        <div className="rounded-lg border border-border/60 bg-secondary/30 p-3">
          <p className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground">
            <ShieldAlert className="size-3" /> Risk score
          </p>
          <p className="mt-1 font-mono text-2xl font-semibold text-foreground">
            {decision.riskScore}/100
          </p>
        </div>
        <div className="rounded-lg border border-border/60 bg-secondary/30 p-3">
          <p className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground">
            <History className="size-3" /> Decision state
          </p>
          <p className="mt-1 text-sm font-semibold capitalize text-foreground">{decision.state}</p>
          <p className="text-[11px] text-muted-foreground">Priority: {decision.priority}</p>
        </div>
      </div>

      <div className="space-y-3 px-5 pb-5">
        {bars.map(([label, value]) => (
          <div key={label}>
            <div className="mb-1 flex justify-between text-[10px] uppercase tracking-wide text-muted-foreground">
              <span>{label}</span>
              <span className="font-mono text-foreground">{Math.round(value * 100)}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
              <div className="h-full rounded-full bg-primary" style={{ width: `${value * 100}%` }} />
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-border/60 px-5 py-4">
        <p className="mb-2 text-[10px] uppercase tracking-wide text-muted-foreground">Decision evidence</p>
        <div className="flex flex-wrap gap-2">
          {decision.reasons.map((reason) => (
            <span key={reason} className="rounded-full border border-border/60 bg-secondary/30 px-2.5 py-1 text-[11px] text-muted-foreground">
              {reason}
            </span>
          ))}
        </div>
      </div>
    </Panel>
  )
}
