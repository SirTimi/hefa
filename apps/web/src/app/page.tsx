import Link from 'next/link'

export default function Home() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Welcome to Hefa</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href="/catalog"
          className="rounded-lg border p-4 hover:bg-muted/30"
        >
          Browse Catalog
        </Link>
        <Link
          href="/merchant"
          className="rounded-lg border p-4 hover:bg-muted/30"
        >
          Merchant Portal
        </Link>
        <Link
          href="/driver"
          className="rounded-lg border p-4 hover:bg-muted/30"
        >
          Driver Portal
        </Link>
        <Link href="/admin" className="rounded-lg border p-4 hover:bg-muted/30">
          Admin Console
        </Link>
      </div>
    </div>
  )
}
