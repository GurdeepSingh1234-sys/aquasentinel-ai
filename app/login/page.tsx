"use client"

import { useState } from "react"
import type { FormEvent } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, LockKeyhole, Mail, Waves, ArrowRight, ShieldCheck } from "lucide-react"

const DEMO_EMAIL = "operator@aquasentinel.ai"
const DEMO_PASSWORD = "Aqua@123"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState(DEMO_EMAIL)
  const [password, setPassword] = useState(DEMO_PASSWORD)
  const [remember, setRemember] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    setError("")

    if (!email.trim() || !password) {
      setError("Enter your email and password.")
      return
    }

    setLoading(true)

    window.setTimeout(() => {
      if (email.trim().toLowerCase() !== DEMO_EMAIL || password !== DEMO_PASSWORD) {
        setLoading(false)
        setError("Invalid demo credentials. Use the credentials shown below.")
        return
      }

      if (remember) {
        window.localStorage.setItem("aquasentinel-auth", "true")
        window.sessionStorage.removeItem("aquasentinel-auth")
      } else {
        window.sessionStorage.setItem("aquasentinel-auth", "true")
        window.localStorage.removeItem("aquasentinel-auth")
      }

      router.replace("/")
    }, 450)
  }

  return (
    <main className="relative flex min-h-screen overflow-hidden bg-background">
      <div className="absolute inset-0 grid-sonar opacity-60" />
      <div className="absolute -left-24 top-1/4 size-80 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute -right-24 bottom-1/4 size-96 rounded-full bg-accent/10 blur-3xl" />

      <div className="relative mx-auto flex w-full max-w-6xl items-center px-5 py-10 lg:px-8">
        <div className="grid w-full overflow-hidden rounded-3xl border border-border/60 bg-card/70 shadow-2xl backdrop-blur-xl lg:grid-cols-[1.08fr_0.92fr]">
          <section className="hidden min-h-[680px] flex-col justify-between border-r border-border/50 p-10 lg:flex">
            <div>
              <div className="flex items-center gap-3">
                <div className="relative flex size-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <Waves className="size-6" />
                  <span className="absolute -right-1 -top-1 size-2.5 rounded-full bg-success ring-4 ring-card" />
                </div>
                <div>
                  <p className="font-semibold tracking-tight text-foreground">AquaSentinel AI</p>
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary/80">SIH26057</p>
                </div>
              </div>

              <div className="mt-20 max-w-lg">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  <ShieldCheck className="size-3.5" />
                  Secure Operations Console
                </div>
                <h1 className="text-4xl font-semibold tracking-tight text-foreground">
                  Turn underwater detections into actionable intelligence.
                </h1>
                <p className="mt-4 max-w-md text-sm leading-7 text-muted-foreground">
                  Sign in to access Side-Scan Sonar analysis, detection intelligence, geospatial
                  monitoring, missions and the AquaFusion threat-response workflow.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-border/60 bg-secondary/30 p-5">
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">AquaFusion pipeline</p>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                {["Detect", "Verify", "Assess", "Locate", "Respond"].map((step, index) => (
                  <div key={step} className="flex items-center gap-2">
                    <span className="rounded-lg border border-border/60 bg-card/70 px-2.5 py-1.5 font-medium text-foreground">
                      {step}
                    </span>
                    {index < 4 ? <ArrowRight className="size-3 text-primary/70" /> : null}
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="flex min-h-[680px] items-center justify-center p-6 sm:p-10">
            <div className="w-full max-w-md">
              <div className="mb-8">
                <div className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-primary/15 text-primary lg:hidden">
                  <Waves className="size-6" />
                </div>
                <h2 className="text-2xl font-semibold tracking-tight text-foreground">Welcome back</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Sign in to your AquaSentinel operations console.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <label className="block">
                  <span className="mb-2 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Email
                  </span>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      autoComplete="username"
                      className="h-11 w-full rounded-xl border border-border/60 bg-background/60 pl-10 pr-3 text-sm text-foreground outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
                      placeholder="operator@aquasentinel.ai"
                    />
                  </div>
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Password
                  </span>
                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      autoComplete="current-password"
                      className="h-11 w-full rounded-xl border border-border/60 bg-background/60 pl-10 pr-11 text-sm text-foreground outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      className="absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </label>

                <div className="flex items-center justify-between gap-4">
                  <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(event) => setRemember(event.target.checked)}
                      className="size-4 rounded border-border bg-background accent-[var(--primary)]"
                    />
                    Remember this device
                  </label>
                  <span className="text-xs text-primary/80">Operations Portal</span>
                </div>

                {error ? (
                  <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-xs text-destructive">
                    {error}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Signing in…" : "Sign in"}
                  {!loading ? <ArrowRight className="size-4" /> : null}
                </button>
              </form>

              <div className="mt-7 rounded-xl border border-primary/20 bg-primary/5 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">Demo credentials</p>
                <div className="mt-2 space-y-1 font-mono text-xs text-muted-foreground">
                  <p>Email: <span className="text-foreground">{DEMO_EMAIL}</span></p>
                  <p>Password: <span className="text-foreground">{DEMO_PASSWORD}</span></p>
                </div>
                <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">
                  Prototype authentication for the SIH demo. Replace with a real auth provider before production deployment.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
