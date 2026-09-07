import { cn } from "@/lib/utils"
import { riskMeta, type Risk } from "@/lib/mock-data"

export function RiskBadge({ risk, className }: { risk: Risk; className?: string }) {
  const meta = riskMeta[risk]
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        meta.bg,
        meta.color,
        "border-current/25",
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", meta.dot)} />
      {meta.label}
    </span>
  )
}

export function StatusPill({
  label,
  tone,
  className,
}: {
  label: string
  tone: "primary" | "success" | "warning" | "destructive" | "muted"
  className?: string
}) {
  const tones: Record<string, string> = {
    primary: "bg-primary/10 text-primary border-primary/25",
    success: "bg-success/10 text-success border-success/25",
    warning: "bg-warning/10 text-warning border-warning/25",
    destructive: "bg-destructive/10 text-destructive border-destructive/25",
    muted: "bg-muted text-muted-foreground border-border",
  }
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize",
        tones[tone],
        className,
      )}
    >
      {label}
    </span>
  )
}
