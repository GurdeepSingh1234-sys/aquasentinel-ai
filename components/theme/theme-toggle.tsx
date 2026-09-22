"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "@/components/theme/theme-provider"

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const nextLabel = theme === "dark" ? "Switch to light theme" : "Switch to dark theme"

  return (
    <button
      onClick={toggleTheme}
      className="flex size-9 items-center justify-center rounded-lg border border-border/60 bg-card/60 text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
      aria-label={nextLabel}
      title={nextLabel}
    >
      {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  )
}
