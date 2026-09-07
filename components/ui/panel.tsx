import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

export function Panel({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border/70 bg-card/80 backdrop-blur-sm",
        "shadow-[0_1px_0_0_oklch(0.78_0.13_200/8%)_inset]",
        className,
      )}
    >
      {children}
    </div>
  )
}

export function PanelHeader({
  title,
  subtitle,
  icon,
  action,
  className,
}: {
  title: string
  subtitle?: string
  icon?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex items-start justify-between gap-4 border-b border-border/60 px-5 py-4", className)}>
      <div className="flex items-center gap-3">
        {icon ? (
          <div className="flex size-9 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
            {icon}
          </div>
        ) : null}
        <div>
          <h3 className="text-sm font-semibold tracking-tight text-foreground">{title}</h3>
          {subtitle ? <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p> : null}
        </div>
      </div>
      {action}
    </div>
  )
}
