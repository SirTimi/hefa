// apps/web/src/app/layout.tsx
import type { Metadata } from 'next'
import Providers from './providers' // this should include AuthProvider + QueryClientProvider
import Header from '@/components/shared/Header'
import './globals.css'

export const metadata: Metadata = {
  title: 'HEFA',
  description: 'Marketplace',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {/* Providers must wrap ANY component that calls useAuth/useQuery */}
        <Providers>
          <Header />
          {children}
        </Providers>
      </body>
    </html>
  )
}
