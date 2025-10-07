'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ShoppingCart, Menu, X, Search } from 'lucide-react'

export function Navigation() {
  const [open, setOpen] = useState(false)

  return (
    <header className="border-b bg-white">
      <div className="container flex h-14 items-center gap-4">
        <button
          className="md:hidden p-2 -ml-2"
          aria-label="Toggle menu"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X /> : <Menu />}
        </button>

        <Link href="/" className="font-semibold text-xl">
          Hefa
        </Link>

        <div className="hidden md:flex items-center flex-1 max-w-xl ml-4">
          <div className="flex w-full items-center gap-2 rounded-md border px-3 py-2">
            <Search className="h-4 w-4 opacity-60" />
            <input
              className="w-full bg-transparent outline-none text-sm"
              placeholder="Search products, stores…"
            />
          </div>
        </div>

        <nav className="ml-auto flex items-center gap-4">
          <Link
            href="/cart"
            className="flex items-center gap-2 text-sm hover:underline"
          >
            <ShoppingCart className="h-4 w-4" /> Cart
          </Link>
          <Link href="/login" className="text-sm hover:underline">
            Sign in
          </Link>
        </nav>
      </div>

      {open && (
        <div className="md:hidden border-t bg-white">
          <div className="container py-3 flex flex-col gap-2 text-sm">
            <Link href="/catalog" className="hover:underline">
              Browse Catalog
            </Link>
            <Link href="/merchant" className="hover:underline">
              Merchant Portal
            </Link>
            <Link href="/driver" className="hover:underline">
              Driver Portal
            </Link>
            <Link href="/admin" className="hover:underline">
              Admin Console
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
