import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 text-center">
      <h1 className="text-3xl font-bold mb-2">Page not found</h1>
      <p className="text-muted-foreground mb-6">
        The page you’re looking for doesn’t exist or was moved.
      </p>
      <Link
        href="/"
        className="inline-block rounded-md border px-4 py-2 hover:bg-accent"
      >
        Back to home
      </Link>
    </main>
  )
}
