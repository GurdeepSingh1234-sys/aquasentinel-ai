import { Analytics } from "@vercel/analytics/next"
import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { AppShell } from "@/components/auth/app-shell"
import { ThemeProvider } from "@/components/theme/theme-provider"
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
  colorScheme: "dark light",
  themeColor: "#0b1420",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider>
          <AppShell>{children}</AppShell>
        </ThemeProvider>
        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  )
}
