"use client"

import { createContext, useContext, useEffect, useMemo, useState } from "react"
import type { ReactNode } from "react"
import {
  browserLocalPersistence,
  browserSessionPersistence,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from "firebase/auth"
import type { User as FirebaseUser } from "firebase/auth"
import { ensureOperatorProfile, initialsFor } from "@/lib/firestore"
import { getFirebaseAuth } from "@/lib/firebase"

export type User = {
  uid: string
  email: string
  name: string
  role: string
  initials: string
}

type AuthResult = {
  ok: boolean
  error?: string
}

type AuthContextValue = {
  user: User | null
  loading: boolean
  initializationError: string | null
  signIn: (email: string, password: string, remember: boolean) => Promise<AuthResult>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function toAppUser(firebaseUser: FirebaseUser, profile: { email: string; name: string; role: string }): User {
  return {
    uid: firebaseUser.uid,
    email: profile.email || firebaseUser.email || "",
    name: profile.name || "Operator",
    role: profile.role || "Operator",
    initials: initialsFor(profile.name || "Operator"),
  }
}

function friendlyAuthError(error: unknown) {
  const code = typeof error === "object" && error && "code" in error
    ? String(error.code)
    : ""

  switch (code) {
    case "auth/invalid-credential":
    case "auth/invalid-login-credentials":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Invalid email or password."
    case "auth/user-disabled":
      return "This operator account has been disabled."
    case "auth/too-many-requests":
      return "Too many sign-in attempts. Please wait and try again."
    case "auth/network-request-failed":
      return "Network error. Check your connection and try again."
    default:
      if (error instanceof Error && error.message) return error.message
      return "Unable to sign in. Please try again."
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [initializationError, setInitializationError] = useState<string | null>(null)

  useEffect(() => {
    let unsubscribe: (() => void) | undefined

    try {
      const auth = getFirebaseAuth()

      unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (!firebaseUser) {
          setUser(null)
          setLoading(false)
          return
        }

        try {
          const profile = await ensureOperatorProfile(firebaseUser)
          setUser(toAppUser(firebaseUser, profile))
        } catch {
          setUser(toAppUser(firebaseUser, {
            email: firebaseUser.email ?? "",
            name: firebaseUser.displayName ?? "Operator",
            role: "Operator",
          }))
        } finally {
          setLoading(false)
        }
      })

      setInitializationError(null)
    } catch (error) {
      setInitializationError(
        error instanceof Error
          ? error.message
          : "Firebase configuration is missing. Add the required values to .env.local.",
      )
      setLoading(false)
    }

    return () => {
      unsubscribe?.()
    }
  }, [])

  const signIn = async (email: string, password: string, remember: boolean): Promise<AuthResult> => {
    try {
      const auth = getFirebaseAuth()

      await setPersistence(
        auth,
        remember ? browserLocalPersistence : browserSessionPersistence,
      )

      await signInWithEmailAndPassword(auth, email.trim(), password)
      return { ok: true }
    } catch (error) {
      return { ok: false, error: friendlyAuthError(error) }
    }
  }

  const signOut = async () => {
    try {
      await firebaseSignOut(getFirebaseAuth())
    } finally {
      setUser(null)
    }
  }

  const value = useMemo(
    () => ({ user, loading, initializationError, signIn, signOut }),
    [user, loading, initializationError],
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
