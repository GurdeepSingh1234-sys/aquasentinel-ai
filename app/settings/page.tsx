"use client"

import { useEffect, useState } from "react"
import { Cpu, Bell, SlidersHorizontal, Ship, ShieldCheck, Cloud, Save, RotateCcw, Loader2 } from "lucide-react"
import { Panel, PanelHeader } from "@/components/ui/panel"
import { cn } from "@/lib/utils"
import { DEFAULT_OPERATOR_SETTINGS, getOperatorSettings, saveOperatorSettings, type OperatorSettings } from "@/lib/firestore"
import { useAuth } from "@/components/auth/auth-provider"

function Toggle({ checked, onChange }: { checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full border transition-colors",
        checked ? "border-primary/40 bg-primary/80" : "border-border bg-secondary",
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 rounded-full bg-background shadow transition-all",
          checked ? "left-[calc(100%-1.375rem)]" : "left-0.5",
        )}
        style={{ height: "1.125rem", width: "1.125rem" }}
      />
    </button>
  )
}

function SettingRow({
  title,
  desc,
  children,
}: {
  title: string
  desc: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-4">
      <div>
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>
      </div>
      {children}
    </div>
  )
}

export default function SettingsPage() {
  const { user } = useAuth()
  const [settings, setSettings] = useState<OperatorSettings>(DEFAULT_OPERATOR_SETTINGS)
  const [savedSettings, setSavedSettings] = useState<OperatorSettings>(DEFAULT_OPERATOR_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    if (!user) return

    let active = true

    void getOperatorSettings(user.uid).then((loaded) => {
      if (!active) return
      setSettings(loaded)
      setSavedSettings(loaded)
      setLoading(false)
    })

    return () => {
      active = false
    }
  }, [user])

  const update = <K extends keyof OperatorSettings>(key: K, value: OperatorSettings[K]) => {
    setSettings((current) => ({ ...current, [key]: value }))
    setMessage("")
  }

  const reset = () => {
    setSettings(DEFAULT_OPERATOR_SETTINGS)
    setMessage("Defaults restored locally. Click Save Changes to persist them.")
  }

  const save = async () => {
    if (!user) return

    setSaving(true)
    setMessage("")

    try {
      await saveOperatorSettings(user.uid, settings)
      setSavedSettings(settings)
      setMessage("Settings saved to your Firestore operator profile.")
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save settings.")
    } finally {
      setSaving(false)
    }
  }

  const dirty = JSON.stringify(settings) !== JSON.stringify(savedSettings)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Cloud className="size-4" />
          </span>
          <div>
            <p className="text-xs font-semibold text-foreground">Operator Preferences</p>
            <p className="text-[11px] text-muted-foreground">
              Settings are stored in your authenticated Firestore profile.
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-success/25 bg-success/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide text-success">
          <span className="size-1.5 rounded-full bg-success" /> {loading ? "Loading" : "Connected"}
        </span>
      </div>

      {message ? (
        <div className={cn(
          "rounded-lg border px-3 py-2.5 text-xs",
          message.includes("Unable") || message.includes("permission")
            ? "border-destructive/30 bg-destructive/10 text-destructive"
            : "border-primary/20 bg-primary/5 text-muted-foreground",
        )}>
          {message}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel>
          <PanelHeader title="Detection Model" subtitle="AI inference configuration" icon={<Cpu className="size-4" />} />
          <div className="space-y-5 p-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Active Model</label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {["YOLO-Sonar v4", "SonarNet-R", "AquaVision-2"].map((model) => (
                  <button
                    key={model}
                    onClick={() => update("model", model)}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-xs font-medium transition-colors",
                      settings.model === model
                        ? "border-primary/50 bg-primary/10 text-primary"
                        : "border-border/60 text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {model}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">Confidence Threshold</label>
                <span className="font-mono text-sm text-primary">{(settings.threshold / 100).toFixed(2)}</span>
              </div>
              <input
                type="range"
                min={10}
                max={95}
                value={settings.threshold}
                onChange={(event) => update("threshold", Number(event.target.value))}
                className="w-full accent-[var(--primary)]"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Contacts below this score are suppressed from the detection registry.
              </p>
            </div>
          </div>
          <div className="divide-y divide-border/50 border-t border-border/50">
            <SettingRow title="GPU Acceleration" desc="Run inference on onboard CUDA cores">
              <Toggle checked={settings.gpuAccel} onChange={(value) => update("gpuAccel", value)} />
            </SettingRow>
            <SettingRow title="Real-time Processing" desc="Analyze sonar tiles as they stream in">
              <Toggle checked={settings.realtime} onChange={(value) => update("realtime", value)} />
            </SettingRow>
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Alerts & Notifications" subtitle="How the team gets notified" icon={<Bell className="size-4" />} />
          <div className="divide-y divide-border/50">
            <SettingRow title="Critical Hazard Alerts" desc="Instant push for critical-risk detections">
              <Toggle checked={settings.criticalAlerts} onChange={(value) => update("criticalAlerts", value)} />
            </SettingRow>
            <SettingRow title="Auto-generate Reports" desc="Create a survey report at mission end">
              <Toggle checked={settings.autoReport} onChange={(value) => update("autoReport", value)} />
            </SettingRow>
            <SettingRow title="Daily Email Digest" desc="Summary of detections sent at 08:00 UTC">
              <Toggle checked={settings.emailDigest} onChange={(value) => update("emailDigest", value)} />
            </SettingRow>
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Survey Defaults" subtitle="Sonar acquisition parameters" icon={<SlidersHorizontal className="size-4" />} />
          <div className="grid grid-cols-2 gap-4 p-5">
            {[
              { label: "Frequency", value: "900 kHz" },
              { label: "Swath Range", value: "50 m" },
              { label: "Ping Rate", value: "20 Hz" },
              { label: "Resolution", value: "2048 px" },
            ].map((field) => (
              <div key={field.label}>
                <label className="mb-1.5 block text-xs uppercase tracking-wide text-muted-foreground">{field.label}</label>
                <input
                  defaultValue={field.value}
                  className="h-9 w-full rounded-lg border border-border/60 bg-card/60 px-3 font-mono text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            ))}
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Fleet & System" subtitle="Connected vehicles and status" icon={<Ship className="size-4" />} />
          <div className="divide-y divide-border/50">
            {[
              { name: "AUV Nereus-2", id: "VH-01", status: "Online" },
              { name: "AUV Triton-1", id: "VH-02", status: "Online" },
              { name: "ROV Kelpie", id: "VH-03", status: "Standby" },
            ].map((vehicle) => (
              <div key={vehicle.id} className="flex items-center justify-between px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <span className={cn("size-2 rounded-full", vehicle.status === "Online" ? "bg-success" : "bg-warning")} />
                  <div>
                    <p className="text-sm font-medium text-foreground">{vehicle.name}</p>
                    <p className="font-mono text-[11px] text-muted-foreground">{vehicle.id}</p>
                  </div>
                </div>
                <span className={cn("text-xs font-medium", vehicle.status === "Online" ? "text-success" : "text-warning")}>
                  {vehicle.status}
                </span>
              </div>
            ))}
            <div className="flex items-center gap-2 px-5 py-3.5 text-xs text-muted-foreground">
              <ShieldCheck className="size-4 text-success" />
              All systems nominal · firmware v3.8.1 · last sync 42s ago
            </div>
          </div>
          <div className="flex justify-end gap-2 border-t border-border/50 p-4">
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-2 rounded-lg border border-border/70 bg-card/60 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary/60"
            >
              <RotateCcw className="size-4" /> Reset
            </button>
            <button
              type="button"
              onClick={() => void save()}
              disabled={saving || loading || !dirty}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </Panel>
      </div>
    </div>
  )
}
