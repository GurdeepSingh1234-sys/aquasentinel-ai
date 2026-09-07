"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Search, Bell, Menu, X, Waves, Satellite } from "lucide-react"
import {
  LayoutDashboard,
  Radar,
  Map,
  ScanSearch,
  TriangleAlert,
  Navigation,
  FileText,
  Settings,
} from "lucide-react"
import { cn } from "@/lib/utils"

const titles: Record<string, { title: string; subtitle: string }> = {
  "/": { title: "Command Overview", subtitle: "Real-time marine surveillance & detection intelligence" },
  "/sonar-analysis": { title: "Sonar Analysis", subtitle: "AI inference on Side-Scan Sonar imagery" },
  "/detection-map": { title: "Detection Map", subtitle: "Geospatial distribution of underwater contacts" },
  "/detections": { title: "Detections", subtitle: "Confirmed and pending object classifications" },
  "/anomalies": { title: "Anomalies", subtitle: "Non-standard acoustic signatures flagged by AI" },
  "/missions": { title: "Missions", subtitle: "AUV / ROV survey operations" },
  "/reports": { title: "Reports", subtitle: "Generated survey and incident documentation" },
  "/settings": { title: "Settings", subtitle: "System, detection model and fleet configuration" },
}

const mobileNav = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/sonar-analysis", label: "Sonar Analysis", icon: Radar },
  { href: "/detection-map", label: "Detection Map", icon: Map },
  { href: "/detections", label: "Detections", icon: ScanSearch },
  { href: "/anomalies", label: "Anomalies", icon: TriangleAlert },
  { href: "/missions", label: "Missions", icon: Navigation },
  { href: "/reports", label: "Reports", icon: FileText },
  { href: "/settings", label: "Settings", icon: Settings },
]

export function Topbar() {
  const pathname = usePathname()
  const meta = titles[pathname] ?? { title: "AquaSentinel AI", subtitle: "" }
  const [open, setOpen] = useState(false)
  const [now, setNow] = useState<string>("")

  useEffect(() => {
    const tick = () =>
      setNow(
        new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) + " UTC",
      )
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  return (
    <header className="sticky top-0 z-20 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="flex h-16 items-center gap-4 px-4 sm:px-6">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex size-9 items-center justify-center rounded-lg border border-border/60 text-muted-foreground lg:hidden"
          aria-label="Toggle navigation"
        >
          {open ? <X className="size-4" /> : <Menu className="size-4" />}
        </button>

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-semibold tracking-tight text-foreground sm:text-lg">
            {meta.title}
          </h1>
          <p className="hidden truncate text-xs text-muted-foreground sm:block">{meta.subtitle}</p>
        </div>

        <div className="relative hidden md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            placeholder="Search detections, missions…"
            className="h-9 w-56 rounded-lg border border-border/60 bg-card/60 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="hidden items-center gap-2 rounded-lg border border-border/60 bg-card/60 px-3 py-1.5 font-mono text-xs text-primary sm:flex">
          <Satellite className="size-3.5" />
          {now}
        </div>

        <button className="relative flex size-9 items-center justify-center rounded-lg border border-border/60 text-muted-foreground hover:text-foreground" aria-label="Alerts">
          <Bell className="size-4" />
          <span className="absolute right-2 top-2 size-2 rounded-full bg-destructive ring-2 ring-background" />
        </button>

        <div className="flex items-center gap-2.5 rounded-lg border border-border/60 bg-card/60 py-1 pl-1 pr-3">
          <div className="flex size-7 items-center justify-center rounded-md bg-primary/15 font-mono text-xs font-semibold text-primary">
            AR
          </div>
          <div className="hidden leading-tight sm:block">
            <p className="text-xs font-medium text-foreground">Cmdr. A. Rao</p>
            <p className="text-[10px] text-muted-foreground">Operations Lead</p>
          </div>
        </div>
      </div>

      {open ? (
        <div className="border-t border-border/60 bg-sidebar px-3 py-3 lg:hidden">
          <div className="mb-3 flex items-center gap-2 px-2">
            <Waves className="size-4 text-primary" />
            <span className="font-mono text-[10px] uppercase tracking-widest text-primary/80">AquaSentinel · SIH26057</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {mobileNav.map((item) => {
              const active = pathname === item.href
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm",
                    active ? "bg-primary/10 font-medium text-primary" : "text-muted-foreground hover:bg-secondary/60",
                  )}
                >
                  <Icon className="size-4" />
                  {item.label}
                </Link>
              )
            })}
          </div>
        </div>
      ) : null}
    </header>
  )
}
