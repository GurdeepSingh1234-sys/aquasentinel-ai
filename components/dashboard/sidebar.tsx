"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Radar,
  Map,
  ScanSearch,
  TriangleAlert,
  Navigation,
  FileText,
  Settings,
  Waves,
  Circle,
} from "lucide-react"
import { cn } from "@/lib/utils"

const nav = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/sonar-analysis", label: "Sonar Analysis", icon: Radar },
  { href: "/detection-map", label: "Detection Map", icon: Map },
  { href: "/detections", label: "Detections", icon: ScanSearch },
  { href: "/anomalies", label: "Anomalies", icon: TriangleAlert },
  { href: "/missions", label: "Missions", icon: Navigation },
  { href: "/reports", label: "Reports", icon: FileText },
  { href: "/settings", label: "Settings", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-5">
        <div className="relative flex size-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <Waves className="size-5" />
          <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-success ring-2 ring-sidebar" />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold tracking-tight text-foreground">AquaSentinel AI</p>
          <p className="font-mono text-[10px] uppercase tracking-widest text-primary/80">SIH26057</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        <p className="px-3 pb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Command
        </p>
        {nav.map((item) => {
          const active = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-primary/10 font-medium text-primary"
                  : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
              )}
            >
              <Icon className={cn("size-4 shrink-0", active ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
              {item.label}
              {active ? <span className="ml-auto size-1.5 rounded-full bg-primary" /> : null}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <div className="rounded-lg border border-border/60 bg-card/60 p-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-success/60" />
              <span className="relative inline-flex size-2 rounded-full bg-success" />
            </span>
            <span className="font-medium text-foreground">Fleet Online</span>
          </div>
          <div className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground">
            <Circle className="size-3 fill-primary/20 text-primary" />
            3 vehicles · 2 active sweeps
          </div>
        </div>
      </div>
    </aside>
  )
}
