"use client"

import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  setDoc,
  writeBatch,
  type DocumentData,
  type Unsubscribe,
} from "firebase/firestore"
import type { User as FirebaseUser } from "firebase/auth"
import { getFirebaseDb } from "@/lib/firebase"
import {
  detections as seedDetections,
  missions as seedMissions,
  type Detection,
  type Mission,
} from "@/lib/mock-data"

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
  collectionName: string,
  data: DocumentData,
) {
  await setDoc(
    doc(getFirebaseDb(), collectionName, uid),
    {
      ...data,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )
}

function missionFromFirestore(data: DocumentData): Mission {
  return {
    id: String(data.id ?? ""),
    name: String(data.name ?? "Untitled Mission"),
    vehicle: String(data.vehicle ?? "Unknown Vehicle"),
    status: data.status ?? "queued",
    progress: Number(data.progress ?? 0),
    area: String(data.area ?? "Unassigned"),
    coverage: Number(data.coverage ?? 0),
    detections: Number(data.detections ?? 0),
    startedAt: String(data.startedAt ?? ""),
    operator: String(data.operator ?? "Operator"),
  }
}

function detectionFromFirestore(data: DocumentData): Detection {
  return {
    id: String(data.id ?? ""),
    object: String(data.object ?? "Unknown Contact"),
    category: data.category ?? "unknown",
    confidence: Number(data.confidence ?? 0),
    depth: Number(data.depth ?? 0),
    gps: {
      lat: Number(data.gps?.lat ?? 0),
      lng: Number(data.gps?.lng ?? 0),
    },
    risk: data.risk ?? "low",
    mission: String(data.mission ?? "—"),
    timestamp: String(data.timestamp ?? ""),
    status: data.status ?? "pending",
  }
}

export async function seedMissionsIfEmpty() {
  const db = getFirebaseDb()
  const snapshot = await getDocs(collection(db, "missions"))

  if (!snapshot.empty) return false

  const batch = writeBatch(db)

  seedMissions.forEach((mission) => {
    batch.set(doc(db, "missions", mission.id), {
      ...mission,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  })

  await batch.commit()
  return true
}

export async function seedDetectionsIfEmpty() {
  const db = getFirebaseDb()
  const snapshot = await getDocs(collection(db, "detections"))

  if (!snapshot.empty) return false

  const batch = writeBatch(db)

  seedDetections.forEach((detection) => {
    batch.set(doc(db, "detections", detection.id), {
      ...detection,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  })

  await batch.commit()
  return true
}

export function subscribeToMissions(
  onChange: (missions: Mission[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    collection(getFirebaseDb(), "missions"),
    (snapshot) => {
      const rows = snapshot.docs
        .map((item) => missionFromFirestore(item.data()))
        .filter((mission) => Boolean(mission.id))
        .sort((a, b) => b.startedAt.localeCompare(a.startedAt))

      onChange(rows)
    },
    (error) => onError?.(error),
  )
}

export function subscribeToDetections(
  onChange: (detections: Detection[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    collection(getFirebaseDb(), "detections"),
    (snapshot) => {
      const rows = snapshot.docs
        .map((item) => detectionFromFirestore(item.data()))
        .filter((detection) => Boolean(detection.id))
        .sort((a, b) => b.timestamp.localeCompare(a.timestamp))

      onChange(rows)
    },
    (error) => onError?.(error),
  )
}
