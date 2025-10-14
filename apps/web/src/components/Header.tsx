'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Heart, Bell, User2, ShoppingCart, Search } from 'lucide-react'
import { useState } from 'react'

// Full HEFA categories (your list)
const ALL_CATEGORIES = [
  'Groceries & Essentials',
  'Food & Restaurants',
  'Pharmacy & Health',
  'Fashion & Beauty',
  'Electronics & Accessories',
  'Home & Living',
  'Baby, Kids & Toys',
  'Automotive & Spare Parts',
  'Stationery & Office',
  'Agriculture & Farm Produce',
  'Beverages & Alcohol',
  'Services',
  'Local Artisans & Crafts',
]

// First 6 on the rail, the rest go under “More”
const VISIBLE = ALL_CATEGORIES.slice(0, 6)
const MORE = ALL_CATEGORIES.slice(6)

export default function Header() {
  const [q, setQ] = useState('')
  const router = useRouter()

  return (
    <header className=" top-0 relative  w-full bg-white ">
      <div className="w-full bg-primary/5 text-primary text-sm py-2 no-">
        <div className="container text-center">
          Free shipping on first order. New user?{' '}
          <Link
            className="font-semibold underline no-underline hover:opacity-90"
            href="/promo/WELCOME15"
          >
            WELCOME15
          </Link>
        </div>
      </div>

      <div className="container flex items-center gap-4 py-2 pl-20 pr-20">
        <Link href="/" className="flex items-center gap-2 no-underline">
          <Image src="/HEFA.png" alt="Hefa" width={100} height={100} />
        </Link>

        <form
          className="flex-1 flex items-center"
          onSubmit={(e) => {
            e.preventDefault()
            const term = q.trim()
            if (term) router.push(`/search?q=${encodeURIComponent(term)}`)
          }}
        >
          <div className="flex w-full">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search products, Stores..."
              className="h-11 w-full rounded-l-full border border-border px-4 text-base outline-none focus:ring-2 focus:ring-primary/30"
            />
            <button
              type="submit"
              className="h-11 -ml-px rounded-r-full bg-primary px-5 text-white hover:bg-primary/90 inline-flex items-center gap-2"
            >
              <Search size={18} />
              <span className="hidden sm:inline">Search</span>
            </button>
          </div>
        </form>

        <nav className="hidden md:flex items-center gap-3">
          <IconBtn
            href="/notifications"
            icon={<Bell size={20} />}
            label="Notifications"
          />
          <IconBtn
            href="/wishlist"
            icon={<Heart size={20} />}
            label="Watchlist"
          />
          <IconBtn
            href="/account"
            icon={<User2 size={20} />}
            label="My Account"
          />
          <IconBtn
            href="/cart"
            icon={<ShoppingCart size={20} />}
            label="Cart"
          />
        </nav>
      </div>

      {/* Category rail */}
      <div className="relative border-y border-border bg-white/70 pl-30">
        <div className="container overflow-x-auto overflow-y-visible no-scrollbar">
          <ul className="flex items-center gap-6 min-w-max py-3 text-sm">
            {VISIBLE.map((c) => (
              <li key={c} className="shrink-0">
                <Link
                  className="text-zinc-600 hover:text-foreground no-underline"
                  href={`/c/${encodeURIComponent(c)}`}
                >
                  {c}
                </Link>
              </li>
            ))}

            {/* More dropdown – native <details> for accessibility */}
            <li className="relative">
              <details className="group">
                <summary className="inline-flex cursor pointer select-none items-center gap-1 text-zinc-600 hover:text-foreground list-none">
                  More
                  <svg
                    className="size-3 transition-transform group-open:rotate-180"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
                      fill="currentColor"
                    />
                  </svg>
                </summary>

                <div className="absolute left-0 top-full mt-2 w-72 rounded-lg border border-border bg-white shadow-xl py-2 ">
                  <ul className="max-h-80 overflow-y-visible">
                    {MORE.map((c) => (
                      <li key={c}>
                        <Link
                          href={`/c/${encodeURIComponent(c)}`}
                          className="block px-3 py-2 text-sm text-zinc-700 hover:bg-muted no-underline"
                        >
                          {c}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </details>
            </li>
          </ul>
        </div>
      </div>
    </header>
  )
}

function IconBtn({
  href,
  icon,
  label,
}: {
  href: string
  icon: React.ReactNode
  label: string
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-2 hover:bg-muted no-underline"
      aria-label={label}
      title={label}
    >
      {icon}
      <span className="hidden lg:inline text-sm">{label}</span>
    </Link>
  )
}
