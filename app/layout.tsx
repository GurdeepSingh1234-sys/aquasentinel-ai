import { Analytics } from "@vercel/analytics/next"
import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Topbar } from "@/components/dashboard/topbar"
import "./globals.css"

const geistSans = Geist({ subsets: ["latin"], variable: "--font-geist-sans" })
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" })

export const metadata: Metadata = {
  title: "AquaSentinel AI — Marine Debris & Anomaly Detection",
  description:
    "AI-powered command center for detecting underwater marine debris and anomalies from Side-Scan Sonar imagery. SIH26057.",
  generator: "v0.app",
}

export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#0b1420",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`dark bg-background ${geistSans.variable} ${geistMono.variable}`}>
      <body className="font-sans antialiased">
        <div className="min-h-screen">
          <Sidebar />
          <div className="lg:pl-64">
            <Topbar />
            <main className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6">{children}</main>
          </div>
        </div>
        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  )
}
