import type { Metadata } from "next"
import { Inter, Cinzel } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--cinzel-font",
  display: "swap",
  weight: ["400", "600", "700"],
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
      <body className={`${inter.className} ${cinzel.variable}`}>{children}</body>
    </html>
  )
}
