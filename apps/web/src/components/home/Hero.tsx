export default function Hero() {
  return (
    <section className="w-full bg-hero-gradient">
      <div className="mx-auto max-w-7xl px-4 py-10 md:py-14 pl-20">
        <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-2">
          <div>
            <h1 className="text-3xl font-bold leading-tight text-white md:text-5xl">
              Everything you need, <br className="hidden md:block" /> delivered
              fast.
            </h1>
            <p className="mt-4 max-w-xl text-white/90 md:text-lg ">
              Groceries, meals, pharmacy, fashion, electronics, services and
              more, all from trusted local sellers.
            </p>
            <div className="mt-6 flex items-center gap-3">
              <a
                href="/c/groceries"
                className="btn btn-primary bg-white text-brand-green hover:opacity-95"
              >
                Explore Deals
              </a>
              <a
                href="/c/food"
                className="btn btn-outline bg-white/10 text-white border-white/40"
              >
                Start Selling
              </a>
            </div>
          </div>

          {/* Visual placeholder (swap with banner image when ready) */}
          <div className="h-56 w-full rounded-2xl bg-white/10 backdrop-blur-sm md:h-72 pr-20" />
        </div>
      </div>
    </section>
  )
}
