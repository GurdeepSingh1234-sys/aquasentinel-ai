"use client"

import { useMemo, useState } from "react"
import { FileText, Download, Eye, FileClock, ShieldAlert, ClipboardList, FileBarChart, Cloud, Loader2, X, Printer } from "lucide-react"
import { Panel, PanelHeader } from "@/components/ui/panel"
import { cn } from "@/lib/utils"
import type { Report } from "@/lib/mock-data"
import { seedReportsIfEmpty, subscribeToReports } from "@/lib/firestore"
import { useEffect } from "react"

const typeMeta: Record<Report["type"], { label: string; icon: React.ReactNode; tone: string }> = {
  survey: { label: "Survey", icon: <FileBarChart className="size-4" />, tone: "text-primary bg-primary/10 border-primary/25" },
  incident: { label: "Incident", icon: <ShieldAlert className="size-4" />, tone: "text-destructive bg-destructive/10 border-destructive/25" },
  compliance: { label: "Compliance", icon: <ClipboardList className="size-4" />, tone: "text-accent bg-accent/10 border-accent/25" },
  summary: { label: "Summary", icon: <FileClock className="size-4" />, tone: "text-warning bg-warning/10 border-warning/25" },
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
}

function printReport(report: Report) {
  const popup = window.open("", "_blank", "width=900,height=700")
  if (!popup) return

  const meta = typeMeta[report.type]
  popup.document.write(`
    <!doctype html>
    <html>
      <head>
        <title>${escapeHtml(report.title)}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 48px; color: #111827; line-height: 1.6; }
          .brand { color: #0891b2; font-size: 13px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; }
          h1 { margin: 8px 0 4px; font-size: 26px; }
          .meta { color: #4b5563; font-size: 13px; margin: 0 0 28px; }
          .card { border: 1px solid #d1d5db; border-radius: 12px; padding: 20px; margin-top: 24px; }
          .row { display: flex; justify-content: space-between; gap: 24px; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
          .row:last-child { border-bottom: 0; }
          .label { color: #6b7280; }
          .value { font-weight: 600; }
          .footer { margin-top: 42px; color: #6b7280; font-size: 11px; }
        </style>
      </head>
      <body>
        <div class="brand">AquaSentinel AI · ${escapeHtml(meta.label)} Report</div>
        <h1>${escapeHtml(report.title)}</h1>
        <p class="meta">${escapeHtml(report.id)} · generated ${escapeHtml(report.generatedAt)}</p>
        <div class="card">
          <div class="row"><span class="label">Mission</span><span class="value">${escapeHtml(report.mission)}</span></div>
          <div class="row"><span class="label">Report type</span><span class="value">${escapeHtml(meta.label)}</span></div>
          <div class="row"><span class="label">File size</span><span class="value">${escapeHtml(report.size)}</span></div>
          <div class="row"><span class="label">Author</span><span class="value">${escapeHtml(report.author)}</span></div>
        </div>
        <p class="footer">Generated from the AquaSentinel authenticated report registry. Use the browser print dialog and choose “Save as PDF” to export this document.</p>
      </body>
    </html>
  `)
  popup.document.close()
  popup.focus()
  setTimeout(() => popup.print(), 250)
}

export default function ReportsPage() {
  const [type, setType] = useState<Report["type"] | "all">("all")
  const [reports, setReports] = useState<Report[]>([])
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [seeded, setSeeded] = useState(false)

  useEffect(() => {
    let active = true
    let unsubscribe: (() => void) | undefined

    const start = async () => {
      try {
        const didSeed = await seedReportsIfEmpty()
        if (!active) return
        setSeeded(didSeed)

        unsubscribe = subscribeToReports(
          (rows) => {
            if (!active) return
            setReports(rows)
            setLoading(false)
          },
          (subscriptionError) => {
            if (!active) return
            setError(subscriptionError.message || "Unable to load report data.")
            setLoading(false)
          },
        )
      } catch (loadError) {
        if (!active) return
        setError(loadError instanceof Error ? loadError.message : "Unable to connect to Firestore.")
        setLoading(false)
      }
    }

    void start()

    return () => {
      active = false
      unsubscribe?.()
    }
  }, [])

  const rows = useMemo(
    () => (type === "all" ? reports : reports.filter((report) => report.type === type)),
    [type, reports],
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Cloud className="size-4" />
          </span>
          <div>
            <p className="text-xs font-semibold text-foreground">Live Firestore Report Library</p>
            <p className="text-[11px] text-muted-foreground">Authenticated report metadata updates in real time.</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-success/25 bg-success/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide text-success">
          <span className="size-1.5 animate-pulse rounded-full bg-success" /> {loading ? "Syncing" : "Connected"}
        </span>
      </div>

      {seeded ? (
        <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-muted-foreground">
          Demo report records were initialized in Firestore because the report collection was empty.
        </div>
      ) : null}

      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-xs text-destructive">
          Firestore report data error: {error}
        </div>
      ) : null}

      <Panel className="grid-sonar relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-card to-transparent" />
        <div className="relative flex flex-col items-start justify-between gap-4 p-6 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-foreground">Reports & Documentation</h2>
            <p className="mt-1 text-sm text-muted-foreground">Auto-generated survey summaries, incident logs and compliance digests.</p>
          </div>
          <button
            type="button"
            onClick={() => rows[0] && printReport(rows[0])}
            disabled={!rows.length}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            <Printer className="size-4" /> Print / PDF
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
              {(["all", "survey", "incident", "compliance", "summary"] as const).map((reportType) => (
                <button
                  key={reportType}
                  onClick={() => setType(reportType)}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-xs font-medium capitalize transition-colors",
                    type === reportType
                      ? "border-primary/50 bg-primary/10 text-primary"
                      : "border-border/60 text-muted-foreground hover:text-foreground",
                  )}
                >
                  {reportType}
                </button>
              ))}
            </div>
          }
        />

        {loading ? (
          <div className="flex min-h-56 items-center justify-center">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin text-primary" /> Loading reports from Firestore…
            </div>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {rows.map((report) => {
              const meta = typeMeta[report.type]
              return (
                <div key={report.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center">
                  <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg border", meta.tone)}>
                    {meta.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{report.title}</p>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 font-mono text-[11px] text-muted-foreground">
                      <span>{report.id}</span>
                      <span>{report.mission}</span>
                      <span>{report.generatedAt}</span>
                      <span>{report.size}</span>
                      <span>by {report.author}</span>
                    </div>
                  </div>
                  <span className={cn("hidden rounded-full border px-2.5 py-0.5 text-xs font-medium sm:inline-flex", meta.tone)}>
                    {meta.label}
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedReport(report)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border/70 bg-card/60 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary/60"
                    >
                      <Eye className="size-3.5" /> View
                    </button>
                    <button
                      type="button"
                      onClick={() => printReport(report)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border/70 bg-card/60 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary/60"
                    >
                      <Download className="size-3.5" /> PDF
                    </button>
                  </div>
                </div>
              )
            })}
            {!rows.length ? (
              <div className="px-5 py-12 text-center text-sm text-muted-foreground">No reports match the selected filter.</div>
            ) : null}
          </div>
        )}
      </Panel>

      {selectedReport ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-border/70 bg-card shadow-2xl">
            <div className="flex items-start justify-between border-b border-border/60 px-5 py-4">
              <div>
                <p className="text-lg font-semibold text-foreground">{selectedReport.title}</p>
                <p className="mt-1 font-mono text-xs text-muted-foreground">{selectedReport.id}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                className="flex size-8 items-center justify-center rounded-lg border border-border/60 text-muted-foreground hover:text-foreground"
                aria-label="Close report preview"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <Info label="Type" value={typeMeta[selectedReport.type].label} />
                <Info label="Mission" value={selectedReport.mission} />
                <Info label="Generated" value={selectedReport.generatedAt} />
                <Info label="Size" value={selectedReport.size} />
                <Info label="Author" value={selectedReport.author} />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => printReport(selectedReport)}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  <Printer className="size-4" /> Print / Save PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/60 bg-secondary/30 p-3">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
    </div>
  )
}
