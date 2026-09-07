import { cn } from "@/lib/utils"

/* Waterfall / activity bars */
export function ActivityBars({ data, className }: { data: number[]; className?: string }) {
  const max = Math.max(...data)
  return (
    <div className={cn("flex h-full items-end gap-[3px]", className)}>
      {data.map((v, i) => (
        <div key={i} className="flex-1 rounded-sm bg-gradient-to-t from-primary/25 to-primary/80" style={{ height: `${(v / max) * 100}%` }} />
      ))}
    </div>
  )
}

/* Sparkline / area line */
export function AreaLine({
  points,
  className,
  stroke = "var(--primary)",
}: {
  points: number[]
  className?: string
  stroke?: string
}) {
  const max = Math.max(...points)
  const min = Math.min(...points)
  const range = max - min || 1
  const w = 100
  const h = 40
  const step = w / (points.length - 1)
  const coords = points.map((p, i) => [i * step, h - ((p - min) / range) * (h - 6) - 3])
  const line = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c[0].toFixed(1)},${c[1].toFixed(1)}`).join(" ")
  const area = `${line} L${w},${h} L0,${h} Z`
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className={cn("h-full w-full", className)}>
      <defs>
        <linearGradient id="area-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.35" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#area-fill)" />
      <path d={line} fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/* Grouped bar chart */
export function GroupedBars({
  data,
}: {
  data: { day: string; debris: number; hazards: number }[]
}) {
  const max = Math.max(...data.flatMap((d) => [d.debris, d.hazards]))
  return (
    <div className="flex h-full items-end justify-between gap-3">
      {data.map((d) => (
        <div key={d.day} className="flex flex-1 flex-col items-center gap-2">
          <div className="flex h-40 w-full items-end justify-center gap-1">
            <div
              className="w-1/2 max-w-3 rounded-t bg-gradient-to-t from-primary/40 to-primary"
              style={{ height: `${(d.debris / max) * 100}%` }}
              title={`Debris: ${d.debris}`}
            />
            <div
              className="w-1/2 max-w-3 rounded-t bg-gradient-to-t from-warning/40 to-warning"
              style={{ height: `${(d.hazards / max) * 100}%` }}
              title={`Hazards: ${d.hazards}`}
            />
          </div>
          <span className="text-[10px] text-muted-foreground">{d.day}</span>
        </div>
      ))}
    </div>
  )
}

/* Horizontal progress bar */
export function Meter({
  value,
  tone = "primary",
  className,
}: {
  value: number
  tone?: "primary" | "success" | "warning" | "destructive" | "accent"
  className?: string
}) {
  const tones: Record<string, string> = {
    primary: "bg-primary",
    accent: "bg-accent",
    success: "bg-success",
    warning: "bg-warning",
    destructive: "bg-destructive",
  }
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-secondary", className)}>
      <div className={cn("h-full rounded-full transition-all", tones[tone])} style={{ width: `${value}%` }} />
    </div>
  )
}
