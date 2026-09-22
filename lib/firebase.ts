"use client"

import { getApp, getApps, initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

const requiredEnv = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
}

function getConfig() {
  const missing = Object.entries(requiredEnv)
    .filter(([, value]) => !value)
    .map(([key]) => key)

  if (missing.length > 0) {
    throw new Error(
      `Firebase configuration is missing: ${missing.join(", ")}. Add these values to .env.local.`,
    )
  }

  return {
    apiKey: requiredEnv.apiKey!,
    authDomain: requiredEnv.authDomain!,
    projectId: requiredEnv.projectId!,
    storageBucket: requiredEnv.storageBucket!,
    messagingSenderId: requiredEnv.messagingSenderId!,
    appId: requiredEnv.appId!,
    measurementId: requiredEnv.measurementId,
  }
}

export function getFirebaseApp() {
  return getApps().length > 0 ? getApp() : initializeApp(getConfig())
}

export function getFirebaseAuth() {
  return getAuth(getFirebaseApp())
}

export function getFirebaseDb() {
  return getFirestore(getFirebaseApp())
}
