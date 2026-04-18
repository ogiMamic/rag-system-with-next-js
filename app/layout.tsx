import type React from "react"
import type { Metadata } from "next"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Omarska Marketplace | Domaći proizvodi i seoski turizam",
  description:
    "Marketplace koji povezuje mještane Omarske sa dijasporom. Domaći proizvodi (med, rakija, sir, ajvar) i seoska domaćinstva direktno od ljudi koji ih prave.",
  generator: "v0.app",
  keywords: ["Omarska", "marketplace", "BiH", "dijaspora", "domaći proizvodi", "seoski turizam"],
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="bs">
      <body className={`font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
