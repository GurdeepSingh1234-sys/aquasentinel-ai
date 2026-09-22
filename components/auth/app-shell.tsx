"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Topbar } from "@/components/dashboard/topbar"

const hasSession = () =>
  typeof window !== "undefined" &&
  (window.localStorage.getItem("aquasentinel-auth") === "true" ||
    window.sessionStorage.getItem("aquasentinel-auth") === "true")

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const authenticated = hasSession()

    if (pathname === "/login") {
      if (authenticated) router.replace("/")
      else setReady(true)
      return
    }

    if (!authenticated) {
      router.replace("/login")
      return
    }

    setReady(true)
  }, [pathname, router])

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        <div className="flex items-center gap-2 text-sm">
          <span className="size-2 animate-pulse rounded-full bg-primary" />
          Loading AquaSentinel…
        </div>
      </div>
    )
  }

  if (pathname === "/login") {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen">
      <Sidebar />
      <div className="lg:pl-64">
        <Topbar />
        <main className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6">{children}</main>
      </div>
    </div>
  )
}
