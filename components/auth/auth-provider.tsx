"use client"

import { createContext, useContext, useEffect, useMemo, useState } from "react"
import type { ReactNode } from "react"

export type User = {
  email: string
  name: string
  role: string
  initials: string
}

type AuthContextValue = {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string, remember: boolean) => Promise<{ ok: boolean; error?: string }>
  signOut: () => void
}

const DEMO_EMAIL = "operator@aquasentinel.ai"
const DEMO_PASSWORD = "Aqua@123"
const AUTH_KEY = "aquasentinel-session"

const DEMO_USER: User = {
  email: DEMO_EMAIL,
  name: "Cmdr. A. Rao",
  role: "Operations Lead",
  initials: "AR",
}

function readSession(): User | null {
  if (typeof window === "undefined") return null

  const raw =
    window.localStorage.getItem(AUTH_KEY) ??
    window.sessionStorage.getItem(AUTH_KEY)

  if (!raw) return null

  try {
    return JSON.parse(raw) as User
  } catch {
    window.localStorage.removeItem(AUTH_KEY)
    window.sessionStorage.removeItem(AUTH_KEY)
    return null
  }
}

export function getDemoCredentials() {
  return { email: DEMO_EMAIL, password: DEMO_PASSWORD }
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setUser(readSession())
    setLoading(false)
  }, [])

  const signIn = async (email: string, password: string, remember: boolean) => {
    const normalizedEmail = email.trim().toLowerCase()

    await new Promise((resolve) => window.setTimeout(resolve, 450))

    if (normalizedEmail !== DEMO_EMAIL || password !== DEMO_PASSWORD) {
      return {
        ok: false,
        error: "Invalid credentials. Use the demo account shown on the login page.",
      }
    }

    const serialized = JSON.stringify(DEMO_USER)

    if (remember) {
      window.localStorage.setItem(AUTH_KEY, serialized)
      window.sessionStorage.removeItem(AUTH_KEY)
    } else {
      window.sessionStorage.setItem(AUTH_KEY, serialized)
      window.localStorage.removeItem(AUTH_KEY)
    }

    setUser(DEMO_USER)
    return { ok: true }
  }

  const signOut = () => {
    window.localStorage.removeItem(AUTH_KEY)
    window.sessionStorage.removeItem(AUTH_KEY)
    setUser(null)
  }

  const value = useMemo(
    () => ({ user, loading, signIn, signOut }),
    [user, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider")
  }
  return context
}
