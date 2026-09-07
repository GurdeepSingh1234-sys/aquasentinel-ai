import type { ReactNode } from "react"
import { ArrowDownRight, ArrowUpRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Panel } from "@/components/ui/panel"

export function StatCard({
  label,
  value,
  unit,
  icon,
  delta,
  deltaTone = "up",
  footer,
}: {
  label: string
  value: string
  unit?: string
  icon: ReactNode
  delta?: string
  deltaTone?: "up" | "down"
  footer?: ReactNode
}) {
  return (
    <Panel className="p-5">
      <div className="flex items-start justify-between">
        <div className="flex size-10 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
          {icon}
        </div>
        {delta ? (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
              deltaTone === "up" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive",
            )}
          >
            {deltaTone === "up" ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
            {delta}
          </span>
        ) : null}
      </div>
      <div className="mt-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="mt-1 font-mono text-2xl font-semibold tracking-tight text-foreground">
          {value}
          {unit ? <span className="ml-1 text-sm font-normal text-muted-foreground">{unit}</span> : null}
        </p>
      </div>
      {footer ? <div className="mt-3 border-t border-border/50 pt-3">{footer}</div> : null}
    </Panel>
  )
}
