'use client'

import Hero from '@/components/home/Hero'
import { CATEGORIES } from '@/data/categories'
import Link from 'next/link'

export default function HomePage() {
  return (
    <>
      <Hero />

      {/* Category tiles */}
      <section className="mx-auto max-w-7xl px-4 py-10">
        <h2 className="text-xl font-semibold">Shop by category</h2>
        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {CATEGORIES.map((c) => (
            <Link
              key={c.slug}
              href={`/c/${c.slug}`}
              className="rounded-xl border p-4 hover:shadow-soft transition-shadow"
            >
              <div className="h-24 w-full rounded-lg bg-gray-50" />
              <div className="mt-3 text-sm font-medium">{c.name}</div>
            </Link>
          ))}
        </div>
      </section>
    </>
  )
}
