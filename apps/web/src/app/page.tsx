"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowRight, ChevronDown, Filter, Heart, ShoppingCart, Plus, Minus } from "lucide-react"
import { Button } from "@/components/ui/button"

// Hero Banner Component
const HeroBanner = () => {
  return (
    <div className="relative h-96 md:h-[500px] overflow-hidden">
      {/* Background Image with Blur */}
      <div
        className="absolute inset-0 bg-cover bg-center filter blur-sm scale-110"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')",
        }}
      />
      {/* Overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-40" />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 h-full flex flex-col justify-center items-center text-center">
        <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-8 max-w-4xl">
          Everything You Need in One Place
        </h1>

        {/* Feature Points */}
        <div className="flex flex-wrap justify-center items-center gap-8 mb-8 text-white">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-white rounded-full" />
            <span className="text-lg">Shop It</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-white rounded-full" />
            <span className="text-lg">Get It</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-white rounded-full" />
            <span className="text-lg">Love It</span>
          </div>
        </div>

        {/* CTA Button */}
        <Button className="bg-white text-teal-700 hover:bg-gray-100 px-8 py-3 text-lg font-medium">
          Start Shopping
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </div>
  )
}

// Category Navigation
const CategoryNav = () => {
  const categories = ["Furniture", "Clothes", "Food", "Electronics", "Bed", "Interior"]

  return (
    <div className="bg-gray-50 border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-4">
          {/* Categories */}
          <div className="flex space-x-8 overflow-x-auto">
            {categories.map((category, index) => (
              <button
                key={category}
                className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  index === 0
                    ? "border-teal-600 text-teal-600"
                    : "border-transparent text-gray-700 hover:text-teal-600"
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-4">
            <Button variant="outline" className="flex items-center space-x-2">
              <span>Category</span>
              <ChevronDown className="w-4 h-4" />
            </Button>
            <Button variant="outline" className="flex items-center space-x-2">
              <Filter className="w-4 h-4" />
              <span>Filter</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Popular Products Section (with popup quantity controls)
// Popular Products Section (with auto-add on click, popup for quantity)
const PopularProducts = () => {
  const [cartItems, setCartItems] = useState<Record<number, number>>({})
  const [openPopup, setOpenPopup] = useState<number | null>(null)

  const addToCart = (productId: number) => {
    setCartItems((prev) => ({
      ...prev,
      [productId]: (prev[productId] || 0) + 1,
    }))
  }

  const removeFromCart = (productId: number) => {
    setCartItems((prev) => ({
      ...prev,
      [productId]: Math.max(0, (prev[productId] || 0) - 1),
    }))
  }

  const getTotalItems = () => {
    return Object.values(cartItems).reduce((sum, count) => sum + count, 0)
  }

  // Close popup when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (openPopup === null) return
      const target = e.target as HTMLElement
      if (
        !target.closest(`[data-popup-id="${openPopup}"]`) &&
        !target.closest(`[data-cart-button-id="${openPopup}"]`)
      ) {
        setOpenPopup(null)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [openPopup])

  const products = [
    {
      id: 1,
      image:
        "https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      name: "Ribbed Accent Chair",
      price: "$299",
      originalPrice: "$399",
      category: "furniture",
    },
    {
      id: 2,
      image:
        "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      name: "Shell Accent Chair",
      price: "$459",
      originalPrice: "$599",
      category: "furniture",
    },
    // ... rest
  ]

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
          Popular Furniture
        </h2>
        <Button
          variant="ghost"
          className="text-teal-600 hover:text-teal-700 flex items-center space-x-2"
        >
          <span>View All</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {products.map((product) => (
          <div key={product.id} className="group cursor-pointer relative">
            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-4 relative">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              {/* Hover Icons */}
              <div className="absolute top-3 right-3 flex flex-col space-y-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                <button
                  aria-label="Add to wishlist"
                  className="p-2 bg-white rounded-full shadow-md"
                >
                  <Heart className="w-4 h-4 text-gray-600" />
                </button>

                {/* Cart button auto-adds + opens popup */}
                <button
                  data-cart-button-id={product.id}
                  aria-label="Cart popup"
                  className="p-2 bg-white rounded-full shadow-md"
                  onClick={() => {
                    addToCart(product.id)
                    setOpenPopup(product.id)
                  }}
                >
                  <ShoppingCart className="w-4 h-4 text-gray-600" />
                </button>
              </div>

              {/* Popup panel for quantity controls */}
              {openPopup === product.id && cartItems[product.id] > 0 && (
                <div
                  data-popup-id={product.id}
                  className="absolute top-12 right-3 w-44 bg-white rounded-md shadow-lg p-3 z-50"
                >
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => removeFromCart(product.id)}
                      className="p-2 border rounded-md"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="font-semibold">{cartItems[product.id]}</span>
                    <button
                      onClick={() => addToCart(product.id)}
                      className="p-2 border rounded-md"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <h3 className="font-medium text-gray-900 mb-2 group-hover:text-teal-600 transition-colors">
              {product.name}
            </h3>
            <div className="flex items-center space-x-2">
              <span className="text-lg font-bold text-gray-900">{product.price}</span>
              {product.originalPrice && (
                <span className="text-sm text-gray-500 line-through">
                  {product.originalPrice}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Floating Cart Button */}
      {getTotalItems() > 0 && (
        <div className="fixed bottom-6 right-6">
          <Button asChild size="lg" className="rounded-full shadow-lg">
            <Link href="/cart" className="flex items-center px-4 py-2">
              <ShoppingCart className="w-5 h-5 mr-2" />
              Cart ({getTotalItems()})
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}


// Main Component
const FurnitureHomepage = () => {
  return (
    <div className="min-h-screen bg-white">
      <HeroBanner />
      <CategoryNav />
      <PopularProducts />
    </div>
  )
}

export default FurnitureHomepage
