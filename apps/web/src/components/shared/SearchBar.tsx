'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  className?: string
  onSubmit?: (q: string) => void
  defaultValue?: string
  placeholder?: string
}

export default function SearchBar({
  className,
  onSubmit,
  defaultValue = '',
  placeholder = 'Search for products, stores and categories…',
}: Props) {
  const [q, setQ] = useState(defaultValue)

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit?.(q.trim())
      }}
      className={cn(
        'flex w-full items-center',
        // create spacing between field and button (gap-2), field fully rounded
        'gap-2',
      )}
    >
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={placeholder}
        className={cn(
          'h-12 w-full rounded-full border border-gray-300 bg-white px-5 text-[15px]',
          'outline-none focus:border-brand-green transition-colors',
        )}
      />
      <button
        type="submit"
        className={cn(
          'h-12 shrink-0 rounded-full px-5',
          'bg-brand-green text-white font-medium hover:opacity-90',
        )}
      >
        <span className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          <span className="hidden sm:inline">Search</span>
        </span>
      </button>
    </form>
  )
}
