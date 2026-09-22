"use client"

import { useEffect, useState } from "react"

type Theme = "dark" | "light"

const STORAGE_KEY = "aquasentinel-theme"

function applyTheme(theme: Theme) {
  document.documentElement.classList.remove("dark", "light")
  document.documentElement.classList.add(theme)
  document.documentElement.style.colorScheme = theme
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark")

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY) as Theme | null
    const preferred = window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark"
    const next = stored === "light" || stored === "dark" ? stored : preferred
    setTheme(next)
    applyTheme(next)
  }, [])

  useEffect(() => {
    const handler = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return
      const next = event.newValue === "light" ? "light" : "dark"
      setTheme(next)
      applyTheme(next)
    }
    window.addEventListener("storage", handler)
    return () => window.removeEventListener("storage", handler)
  }, [])

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark"
    setTheme(next)
    window.localStorage.setItem(STORAGE_KEY, next)
    applyTheme(next)
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

import { createContext, useContext } from "react"

type ThemeContextValue = {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error("useTheme must be used inside ThemeProvider")
  return context
}
