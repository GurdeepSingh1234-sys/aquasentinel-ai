"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Topbar } from "@/components/dashboard/topbar"
import { useAuth } from "@/components/auth/auth-provider"

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, loading } = useAuth()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (loading) return

    if (pathname === "/login") {
      if (user) {
        router.replace("/")
        return
      }
      setReady(true)
      return
    }

    if (!user) {
      router.replace("/login")
      return
    }

    setReady(true)
  }, [loading, pathname, router, user])

  if (loading || !ready) {
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
