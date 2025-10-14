import Header from '@/components/Header'
import Hero from '@/components/Hero'
import CategoryGrid from '@/components/CategoryGrid'
import FeaturedDeals from '@/components/FeaturedDeals'

export default function HomePage() {
  return (
    <>
      <main className="pb-16">
        <Hero />
        <CategoryGrid />
        <FeaturedDeals />
        {/* next sections go here */}
      </main>
    </>
  )
}
