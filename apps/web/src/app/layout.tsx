import type { Metadata } from 'next'
import './globals.css'
import Header from '@/components/Header'

export const metadata: Metadata = {
  title: 'HEFA — Where shopping meets speed',
  description: 'Multi-vendor marketplace',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Header />
        <main className="container py-6">{children}</main>
      </body>
    </html>
  )
}
