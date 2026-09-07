"use client"

import { useMemo, useState } from "react"
import { FileText, Download, Eye, FileClock, ShieldAlert, ClipboardList, FileBarChart } from "lucide-react"
import { Panel, PanelHeader } from "@/components/ui/panel"
import { cn } from "@/lib/utils"
import { reports, type Report } from "@/lib/mock-data"

const typeMeta: Record<Report["type"], { label: string; icon: React.ReactNode; tone: string }> = {
  survey: { label: "Survey", icon: <FileBarChart className="size-4" />, tone: "text-primary bg-primary/10 border-primary/25" },
  incident: { label: "Incident", icon: <ShieldAlert className="size-4" />, tone: "text-destructive bg-destructive/10 border-destructive/25" },
  compliance: { label: "Compliance", icon: <ClipboardList className="size-4" />, tone: "text-accent bg-accent/10 border-accent/25" },
  summary: { label: "Summary", icon: <FileClock className="size-4" />, tone: "text-warning bg-warning/10 border-warning/25" },
}

export default function ReportsPage() {
  const [type, setType] = useState<Report["type"] | "all">("all")
  const rows = useMemo(() => (type === "all" ? reports : reports.filter((r) => r.type === type)), [type])

  return (
    <div className="space-y-6">
      <Panel className="grid-sonar relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-card to-transparent" />
        <div className="relative flex flex-col items-start justify-between gap-4 p-6 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-foreground">Reports & Documentation</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Auto-generated survey summaries, incident logs and compliance digests.
            </p>
          </div>
          <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
            <FileText className="size-4" /> Generate Report
          </button>
        </div>
      </Panel>

      <Panel>
        <PanelHeader
          title="Document Library"
          subtitle={`${rows.length} documents`}
          icon={<FileText className="size-4" />}
          action={
            <div className="flex flex-wrap gap-1.5">
              {(["all", "survey", "incident", "compliance", "summary"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-xs font-medium capitalize transition-colors",
                    type === t ? "border-primary/50 bg-primary/10 text-primary" : "border-border/60 text-muted-foreground hover:text-foreground",
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          }
        />
        <div className="divide-y divide-border/50">
          {rows.map((r) => {
            const meta = typeMeta[r.type]
            return (
              <div key={r.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center">
                <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg border", meta.tone)}>
                  {meta.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{r.title}</p>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 font-mono text-[11px] text-muted-foreground">
                    <span>{r.id}</span>
                    <span>{r.mission}</span>
                    <span>{r.generatedAt}</span>
                    <span>{r.size}</span>
                    <span>by {r.author}</span>
                  </div>
                </div>
                <span className={cn("hidden rounded-full border px-2.5 py-0.5 text-xs font-medium sm:inline-flex", meta.tone)}>
                  {meta.label}
                </span>
                <div className="flex gap-2">
                  <button className="inline-flex items-center gap-1.5 rounded-lg border border-border/70 bg-card/60 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary/60">
                    <Eye className="size-3.5" /> View
                  </button>
                  <button className="inline-flex items-center gap-1.5 rounded-lg border border-border/70 bg-card/60 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary/60">
                    <Download className="size-3.5" /> PDF
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </Panel>
    </div>
  )
}
