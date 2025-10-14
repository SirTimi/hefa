import Link from 'next/link'

export default function Hero() {
  return (
    <section className="container relative ">
      <div className="h-120 bg-gradient-to-r from-secondary to-accent p-8 sm:p-10 lg:pt-25 text-white shadow-sm">
        <div className="max-w-3xl pr-10 pl-11 ">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
            <span>⚡ Flash Sale</span>
            <span className="rounded-full bg-white/15 px-2 py-0.5">
              Trending
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight">
            Discover Amazing Deals Daily
          </h1>
          <p className="mt-3 text-white/90">
            Shop from trusted sellers with buyer protection and lightning-fast
            delivery.
          </p>
          <div className="mt-6 flex gap-3">
            <Link
              href="/deals"
              className="rounded-full bg-white text-primary px-5 py-2.5 font-semibold hover:bg-white/90"
            >
              Explore Deals
            </Link>
            <Link
              href="/merchant/start"
              className="rounded-full border border-white/70 px-5 py-2.5 font-semibold hover:bg-white/10"
            >
              Start Selling
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
