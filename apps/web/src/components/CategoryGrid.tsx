'use client'

import Link from 'next/link'
import { CATEGORIES } from '@/data/categories'

export default function CategoryGrid() {
  return (
    <section className="container py-8">
      <h2 className="mb-4 text-xl text-center font-semibold text-foreground pt-9 pb-4">
        {' '}
        Shop by Category
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 pl-20 md:grid-cols-4 md:pl-20 pr-20">
        {CATEGORIES.map((c) => (
          <Link
            key={c.key}
            href={`/search?category=${encodeURIComponent(c.key)}`}
            className="rounded-xl border border-border bg-white p-4 text-center hover:shadow-sm transition"
          >
            <div className="mb-2 h-10 w-10 rounded-full bg-brand/10 mx-auto" />
            <div className="text-sm text-foreground">{c.label}</div>
          </Link>
        ))}
      </div>
    </section>
  )
}
