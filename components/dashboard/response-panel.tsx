import { Route, ShieldAlert, Waves } from "lucide-react"
import { Panel, PanelHeader } from "@/components/ui/panel"
import type { ThreatResponse } from "@/lib/threat-response"

export function ThreatResponsePanel({ response }: { response: ThreatResponse }) {
  return (
    <Panel>
      <PanelHeader
        title="Threat Response Engine"
        subtitle="From detection to an inspection action"
        icon={<Route className="size-4" />}
      />
      <div className="grid gap-4 p-5 md:grid-cols-3">
        <div className="rounded-lg border border-destructive/25 bg-destructive/5 p-4">
          <div className="flex items-center gap-2 text-destructive">
            <ShieldAlert className="size-4" />
            <span className="text-xs font-semibold uppercase tracking-wide">Threat zone</span>
          </div>
          <p className="mt-2 font-mono text-sm text-foreground">
            {response.blocked ? "Route intersects hazard" : "No active intersection"}
          </p>
        </div>
        <div className="rounded-lg border border-primary/25 bg-primary/5 p-4">
          <div className="flex items-center gap-2 text-primary">
            <Route className="size-4" />
            <span className="text-xs font-semibold uppercase tracking-wide">Route</span>
          </div>
          <p className="mt-2 font-mono text-sm text-foreground">{response.route.length} waypoints</p>
        </div>
        <div className="rounded-lg border border-border/60 bg-secondary/30 p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Waves className="size-4" />
            <span className="text-xs font-semibold uppercase tracking-wide">Planner</span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{response.note}</p>
        </div>
      </div>
    </Panel>
  )
}
