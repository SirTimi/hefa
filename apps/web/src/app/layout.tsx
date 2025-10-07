import type { Metadata } from 'next'
import './globals.css'
import Providers from './providers'
import { Navigation } from '@/components/shared/navigation'

export const metadata: Metadata = {
  title: 'Hefa',
  description: 'Where Shopping Meets Speed',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-neutral-50 text-neutral-900">
        <Providers>
          <Navigation />
          <main className="container py-8">{children}</main>
          <footer className="mt-12 border-t">
            <div className="container py-8 text-sm text-neutral-500">
              © {new Date().getFullYear()} Hefa
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  )
}
