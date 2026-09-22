"use client"

import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  type DocumentData,
} from "firebase/firestore"
import type { User as FirebaseUser } from "firebase/auth"
import { getFirebaseDb } from "@/lib/firebase"

export type OperatorProfile = {
  email: string
  name: string
  role: "Operator" | "Analyst" | string
}

function fallbackProfile(user: FirebaseUser): OperatorProfile {
  const email = user.email ?? ""
  const localPart = email.split("@")[0] || "Operator"
  const displayName = user.displayName?.trim()
  const derivedName =
    localPart
      .split(/[._-]+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ") || "Operator"

  return {
    email,
    name: displayName || derivedName,
    role: "Operator",
  }
}

export function initialsFor(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "OP"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

export async function getOperatorProfile(user: FirebaseUser): Promise<OperatorProfile> {
  const fallback = fallbackProfile(user)

  try {
    const snapshot = await getDoc(doc(getFirebaseDb(), "users", user.uid))
    if (!snapshot.exists()) return fallback

    const data = snapshot.data() as Partial<OperatorProfile>
    return {
      email: typeof data.email === "string" ? data.email : fallback.email,
      name: typeof data.name === "string" && data.name.trim() ? data.name : fallback.name,
      role: typeof data.role === "string" && data.role.trim() ? data.role : fallback.role,
    }
  } catch {
    // Authentication should still work when Firestore rules have not been deployed yet.
    return fallback
  }
}

export async function ensureOperatorProfile(user: FirebaseUser): Promise<OperatorProfile> {
  const profile = await getOperatorProfile(user)

  try {
    const profileRef = doc(getFirebaseDb(), "users", user.uid)
    const snapshot = await getDoc(profileRef)

    if (!snapshot.exists()) {
      await setDoc(profileRef, {
        ...profile,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    }
  } catch {
    // A locked-down Firestore ruleset should not prevent authentication.
  }

  return profile
}

export async function writeOperatorDocument(
  uid: string,
  collection: string,
  data: DocumentData,
) {
  await setDoc(
    doc(getFirebaseDb(), collection, uid),
    {
      ...data,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )
}
