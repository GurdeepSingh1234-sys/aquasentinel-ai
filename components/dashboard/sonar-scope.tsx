import { cn } from "@/lib/utils"

const blips = [
  { x: 62, y: 40, r: "critical" },
  { x: 38, y: 66, r: "high" },
  { x: 72, y: 70, r: "medium" },
  { x: 46, y: 32, r: "low" },
  { x: 30, y: 48, r: "medium" },
]

const blipColor: Record<string, string> = {
  critical: "fill-destructive",
  high: "fill-warning",
  medium: "fill-primary",
  low: "fill-success",
}

export function SonarScope({ className }: { className?: string }) {
  return (
    <div className={cn("relative aspect-square w-full", className)}>
      <svg viewBox="0 0 100 100" className="size-full">
        <defs>
          <radialGradient id="scope-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.14" />
            <stop offset="70%" stopColor="var(--primary)" stopOpacity="0.03" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="48" fill="url(#scope-glow)" />
        {[48, 36, 24, 12].map((r) => (
          <circle key={r} cx="50" cy="50" r={r} fill="none" stroke="var(--primary)" strokeOpacity="0.18" strokeWidth="0.4" />
        ))}
        <line x1="2" y1="50" x2="98" y2="50" stroke="var(--primary)" strokeOpacity="0.15" strokeWidth="0.4" />
        <line x1="50" y1="2" x2="50" y2="98" stroke="var(--primary)" strokeOpacity="0.15" strokeWidth="0.4" />
        {blips.map((b, i) => (
          <g key={i}>
            <circle cx={b.x} cy={b.y} r="1.4" className={blipColor[b.r]} />
            <circle cx={b.x} cy={b.y} r="1.4" className={blipColor[b.r]} opacity="0.4">
              <animate attributeName="r" from="1.4" to="4" dur="2s" begin={`${i * 0.4}s`} repeatCount="indefinite" />
              <animate attributeName="opacity" from="0.4" to="0" dur="2s" begin={`${i * 0.4}s`} repeatCount="indefinite" />
            </circle>
          </g>
        ))}
      </svg>
      {/* rotating sweep */}
      <div className="animate-sweep absolute inset-0 origin-center">
        <div
          className="absolute left-1/2 top-1/2 h-1/2 w-1/2 origin-top-left"
          style={{
            background: "conic-gradient(from 0deg, var(--primary) 0deg, transparent 55deg)",
            opacity: 0.16,
            clipPath: "polygon(0 0, 100% 0, 0 100%)",
          }}
        />
      </div>
    </div>
  )
}
