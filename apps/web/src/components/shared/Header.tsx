'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Menu, ShoppingCart, Heart, User } from 'lucide-react'
import SearchBar from './SearchBar'
import { HEADERCATEGORIES } from '@/data/categories'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

export default function Header() {
  const router = useRouter()

  return (
    <header className="w-full border-b border-gray-100 bg-white">
      {/* Top strip (optional announcements) */}
      <div className="hidden md:block bg-green-500 text-sm text-white">
        <div className="mx-auto max-w-7xl px-4 py-2 pl-20">
          Free delivery on orders over ₦5,000 — limited time 🎉
        </div>
      </div>

      {/* Main bar */}
      <div className="mx-auto max-w-7xl px-4 py-4 pl-20 pr-20">
        <div className="flex items-center gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo.png" // put your uploaded logo at public/logo.png
              alt="Hefa"
              width={100}
              height={100}
              className="rounded-lg"
              priority
            />
          </Link>

          {/* Search (grows) */}
          <div className="flex-1">
            <SearchBar
              onSubmit={(term) => {
                if (!term) return
                router.push(`/search?q=${encodeURIComponent(term)}`)
              }}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Link
              href="/wishlist"
              className="inline-flex h-12 w-12 items-center justify-center rounded-full border"
              aria-label="Wishlist"
            >
              <Heart className="h-5 w-5" />
            </Link>
            <Link
              href="/cart"
              className="inline-flex h-12 w-12 items-center justify-center rounded-full border"
              aria-label="Cart"
            >
              <ShoppingCart className="h-5 w-5" />
            </Link>
            <Link
              href="/login"
              className="md:inline-flex items-center gap-2 rounded-full border px-4 py-2"
            >
              <User className="h-5 w-5" />
            </Link>
          </div>
        </div>

        {/* Categories rail (desktop) */}
        <nav className="mt-4 hidden md:block">
          <ul className="flex flex-wrap gap-3 text-sm text-gray-700">
            {HEADERCATEGORIES.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/c/${c.slug}`}
                  className="inline-flex items-center rounded-full border px-3 py-1 hover:bg-gray-50"
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  )
}
