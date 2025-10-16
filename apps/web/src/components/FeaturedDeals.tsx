'use client'

type Mock = {
  id: number
  name: string
  price: string
  img: string
}

const mock: Mock[] = [
  {
    id: 1,
    name: 'Featured Product 1',
    price: '1000',
    img: 'https://picsum.photos/seed/hefa-1/400/400',
  },
  {
    id: 2,
    name: 'Featured Product 2',
    price: '2000',
    img: 'https://picsum.photos/seed/hefa-2/400/400',
  },
  {
    id: 3,
    name: 'Featured Product 3',
    price: '3000',
    img: 'https://picsum.photos/seed/hefa-3/400/400',
  },
  {
    id: 4,
    name: 'Featured Product 4',
    price: '4000',
    img: 'https://picsum.photos/seed/hefa-4/400/400',
  },
  {
    id: 5,
    name: 'Featured Product 5',
    price: '5000',
    img: 'https://picsum.photos/seed/hefa-5/400/400',
  },
  {
    id: 6,
    name: 'Featured Product 6',
    price: '6000',
    img: 'https://picsum.photos/seed/hefa-6/400/400',
  },
]

export default function FeaturedDeals() {
  return (
    <section className="container py-8">
      <div className="mb-4 flex items-center justify-between px-20">
        <h2 className="text-xl font-semibold text-foreground">
          Featured Deals
        </h2>
        <a href="/deals" className="text-sm text-brand hover:underline">
          See all
        </a>
      </div>

      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 px-20">
        {mock.map((p) => (
          <article
            key={p.id}
            className="rounded-xl border border-border bg-white p-3 hover:shadow-sm transition"
          >
            <img
              src={p.img}
              alt={p.name}
              className="aspect-square w-full rounded-lg object-cover"
            />
            <div className="mt-3 text-sm text-foreground line-clamp-2">
              {p.name}
            </div>
            <div className="mt-1 font-semibold text-foreground">₦{p.price}</div>
            <button className="mt-2 w-full rounded-lg bg-brand py-2 text-white hover:opacity-90">
              Add to cart
            </button>
          </article>
        ))}
      </div>
    </section>
  )
}
