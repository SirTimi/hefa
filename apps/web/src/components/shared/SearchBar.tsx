'use client'
import React, { useState } from 'react'
import { cn } from '@/lib/utils'

type SearchBarProps = {
  className?: string
  onSubmit?: (term: string) => void
}

export default function SearchBar({ className, onSubmit }: SearchBarProps) {
  const [q, setQ] = useState('')

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const term = q.trim()
    if (!term) return
    onSubmit?.(term)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn('flex items-stretch gap-2', className)}
    >
      <input
        type="text"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search products, stores..."
        className="flex-1 rounded-l-full border px-4 py-2 outline-none"
      />
      <button
        type="submit"
        className="rounded-r-full px-4 py-2 border border-l-0"
      >
        Search
      </button>
    </form>
  )
}
