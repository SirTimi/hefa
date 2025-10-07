import type { Metadata } from 'next'
import './globals.css'
import Providers from './providers'

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
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <Providers>
          <header className="border-b">
            <div className="mx-auto max-w-7xl px-4 py-3 flex items-center gap-4">
              <div className="font-semibold">Hefa</div>
              <div className="flex-1">
                <form action="/search" className="w-full">
                  <input
                    name="q"
                    placeholder="Search products, stores…"
                    className="w-full rounded-md border px-3 py-2 text-sm"
                  />
                </form>
              </div>
              <nav className="flex items-center gap-3 text-sm">
                <a href="/cart">Cart</a>
                <a href="/auth/login">Sign in</a>
              </nav>
            </div>
          </header>
          <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
        </Providers>
      </body>
    </html>
  )
}
