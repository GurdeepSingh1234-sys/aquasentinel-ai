"use client"

import { useState } from "react"
import { Cpu, Bell, SlidersHorizontal, Ship, ShieldCheck } from "lucide-react"
import { Panel, PanelHeader } from "@/components/ui/panel"
import { cn } from "@/lib/utils"

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
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
          "absolute top-0.5 size-4.5 rounded-full bg-background shadow transition-all",
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
  const [threshold, setThreshold] = useState(45)
  const [model, setModel] = useState("YOLO-Sonar v4")
  const [autoReport, setAutoReport] = useState(true)
  const [realtime, setRealtime] = useState(true)
  const [criticalAlerts, setCriticalAlerts] = useState(true)
  const [emailDigest, setEmailDigest] = useState(false)
  const [gpuAccel, setGpuAccel] = useState(true)

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Detection model */}
      <Panel>
        <PanelHeader title="Detection Model" subtitle="AI inference configuration" icon={<Cpu className="size-4" />} />
        <div className="space-y-5 p-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">Active Model</label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {["YOLO-Sonar v4", "SonarNet-R", "AquaVision-2"].map((m) => (
                <button
                  key={m}
                  onClick={() => setModel(m)}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-xs font-medium transition-colors",
                    model === m ? "border-primary/50 bg-primary/10 text-primary" : "border-border/60 text-muted-foreground hover:text-foreground",
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">Confidence Threshold</label>
              <span className="font-mono text-sm text-primary">{(threshold / 100).toFixed(2)}</span>
            </div>
            <input
              type="range"
              min={10}
              max={95}
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="w-full accent-[var(--primary)]"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Contacts below this score are suppressed from the detection registry.
            </p>
          </div>
        </div>
        <div className="divide-y divide-border/50 border-t border-border/50">
          <SettingRow title="GPU Acceleration" desc="Run inference on onboard CUDA cores">
            <Toggle checked={gpuAccel} onChange={setGpuAccel} />
          </SettingRow>
          <SettingRow title="Real-time Processing" desc="Analyze sonar tiles as they stream in">
            <Toggle checked={realtime} onChange={setRealtime} />
          </SettingRow>
        </div>
      </Panel>

      {/* Notifications */}
      <Panel>
        <PanelHeader title="Alerts & Notifications" subtitle="How the team gets notified" icon={<Bell className="size-4" />} />
        <div className="divide-y divide-border/50">
          <SettingRow title="Critical Hazard Alerts" desc="Instant push for critical-risk detections">
            <Toggle checked={criticalAlerts} onChange={setCriticalAlerts} />
          </SettingRow>
          <SettingRow title="Auto-generate Reports" desc="Create a survey report at mission end">
            <Toggle checked={autoReport} onChange={setAutoReport} />
          </SettingRow>
          <SettingRow title="Daily Email Digest" desc="Summary of detections sent at 08:00 UTC">
            <Toggle checked={emailDigest} onChange={setEmailDigest} />
          </SettingRow>
        </div>
      </Panel>

      {/* Survey defaults */}
      <Panel>
        <PanelHeader title="Survey Defaults" subtitle="Sonar acquisition parameters" icon={<SlidersHorizontal className="size-4" />} />
        <div className="grid grid-cols-2 gap-4 p-5">
          {[
            { label: "Frequency", value: "900 kHz" },
            { label: "Swath Range", value: "50 m" },
            { label: "Ping Rate", value: "20 Hz" },
            { label: "Resolution", value: "2048 px" },
          ].map((f) => (
            <div key={f.label}>
              <label className="mb-1.5 block text-xs uppercase tracking-wide text-muted-foreground">{f.label}</label>
              <input
                defaultValue={f.value}
                className="h-9 w-full rounded-lg border border-border/60 bg-card/60 px-3 font-mono text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          ))}
        </div>
      </Panel>

      {/* Fleet + system */}
      <Panel>
        <PanelHeader title="Fleet & System" subtitle="Connected vehicles and status" icon={<Ship className="size-4" />} />
        <div className="divide-y divide-border/50">
          {[
            { name: "AUV Nereus-2", id: "VH-01", status: "Online" },
            { name: "AUV Triton-1", id: "VH-02", status: "Online" },
            { name: "ROV Kelpie", id: "VH-03", status: "Standby" },
          ].map((v) => (
            <div key={v.id} className="flex items-center justify-between px-5 py-3.5">
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "size-2 rounded-full",
                    v.status === "Online" ? "bg-success" : "bg-warning",
                  )}
                />
                <div>
                  <p className="text-sm font-medium text-foreground">{v.name}</p>
                  <p className="font-mono text-[11px] text-muted-foreground">{v.id}</p>
                </div>
              </div>
              <span className={cn("text-xs font-medium", v.status === "Online" ? "text-success" : "text-warning")}>
                {v.status}
              </span>
            </div>
          ))}
          <div className="flex items-center gap-2 px-5 py-3.5 text-xs text-muted-foreground">
            <ShieldCheck className="size-4 text-success" />
            All systems nominal · firmware v3.8.1 · last sync 42s ago
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-border/50 p-4">
          <button className="rounded-lg border border-border/70 bg-card/60 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary/60">
            Reset
          </button>
          <button className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
            Save Changes
          </button>
        </div>
      </Panel>
    </div>
  )
}
