export default function Home() {
  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Welcome to Hefa</h1>
      <p className="text-neutral-600">
        Shop from verified merchants. Secure checkout, escrow, and tracked
        delivery.
      </p>

      <div className="grid gap-4 md:grid-cols-3">
        <a
          className="rounded-lg border bg-white p-6 hover:shadow-sm"
          href="/catalog"
        >
          <div className="font-medium">Browse Catalog</div>
          <div className="text-sm text-neutral-600">
            Find products and stores
          </div>
        </a>
        <a
          className="rounded-lg border bg-white p-6 hover:shadow-sm"
          href="/merchant"
        >
          <div className="font-medium">Merchant Portal</div>
          <div className="text-sm text-neutral-600">
            Manage products and orders
          </div>
        </a>
        <a
          className="rounded-lg border bg-white p-6 hover:shadow-sm"
          href="/driver"
        >
          <div className="font-medium">Driver Portal</div>
          <div className="text-sm text-neutral-600">
            Deliveries & Proof-of-Delivery
          </div>
        </a>
      </div>
    </section>
  )
}
