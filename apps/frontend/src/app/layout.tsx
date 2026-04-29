import type { Metadata } from "next"
import { Inter, Cormorant_Garamond, Cormorant_SC } from "next/font/google"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--inter-font",
  display: "swap",
})

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--cormorant-font",
  display: "swap",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
})

const cormorantSC = Cormorant_SC({
  subsets: ["latin"],
  variable: "--cormorant-sc-font",
  display: "swap",
  weight: ["400", "500", "600", "700"],
})

export const metadata: Metadata = {
  title: "Coup Online",
  description: "Jogue Coup online com seus amigos",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className="dark">
      <body className={`${inter.variable} ${cormorant.variable} ${cormorantSC.variable}`}>
        {children}
      </body>
    </html>
  )
}
