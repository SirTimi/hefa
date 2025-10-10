import type { Metadata } from 'next'
import './globals.css'
import Providers from './providers' // 👈 important

export const metadata: Metadata = {
  title: 'HEFA',
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
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
