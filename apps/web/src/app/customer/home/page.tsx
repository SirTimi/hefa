"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Search, ShoppingCart, Star, Clock, Plus, Minus } from "lucide-react"
import { demoCategories, demoStores, demoProducts } from "@/components/shared/demo-data"
import { CustomerCartSidebar } from "@/components/customer/cart-sidebar"

export default function CustomerHome() {
  const [cartItems, setCartItems] = useState<Record<string, number>>({})
  const [isCartOpen, setIsCartOpen] = useState(false)

  const addToCart = (productId: string) => {
    setCartItems((prev) => ({
      ...prev,
      [productId]: (prev[productId] || 0) + 1,
    }))
  }

  const removeFromCart = (productId: string) => {
    setCartItems((prev) => ({
      ...prev,
      [productId]: Math.max(0, (prev[productId] || 0) - 1),
    }))
  }

  const getTotalItems = () => {
    return Object.values(cartItems).reduce((sum, count) => sum + count, 0)
  }

  const getCartProducts = () => {
    return Object.entries(cartItems)
      .filter(([_, quantity]) => quantity > 0)
      .map(([productId, quantity]) => {
        const product = demoProducts.find((p) => p.id === productId)
        return product ? { ...product, quantity } : null
      })
      .filter(Boolean)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/customer/home" className="text-xl font-bold text-primary">
              Marketplace
            </Link>

            {/* Desktop Cart Sidebar Trigger */}
            <div className="hidden md:block">
              <Button variant="outline" size="sm" onClick={() => setIsCartOpen(true)} className="relative">
                <ShoppingCart className="w-4 h-4 mr-2" />
                Cart
                {getTotalItems() > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs">{getTotalItems()}</Badge>
                )}
              </Button>
            </div>

            {/* Mobile Cart Sheet */}
            <div className="md:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="relative bg-transparent">
                    <ShoppingCart className="w-4 h-4" />
                    {getTotalItems() > 0 && (
                      <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs">
                        {getTotalItems()}
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full sm:max-w-md">
                  <SheetHeader>
                    <SheetTitle>Shopping Cart</SheetTitle>
                  </SheetHeader>
                  <CustomerCartSidebar
                    cartProducts={getCartProducts()}
                    onUpdateQuantity={(productId, quantity) => {
                      setCartItems((prev) => ({ ...prev, [productId]: quantity }))
                    }}
                    onRemoveItem={(productId) => {
                      setCartItems((prev) => {
                        const newCart = { ...prev }
                        delete newCart[productId]
                        return newCart
                      })
                    }}
                  />
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Main Content */}
        <div className="flex-1 container mx-auto px-4 py-8">
          {/* Search Bar */}
          <div className="relative mb-8">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input placeholder="Search for stores, products..." className="pl-10 h-12 text-base" />
          </div>

          {/* Categories */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Browse Categories</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {demoCategories.map((category) => (
                <Link key={category.id} href={`/customer/stores?category=${category.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4 text-center">
                      <div className="aspect-square rounded-lg bg-muted mb-2 overflow-hidden">
                        <img
                          src={category.image || "/placeholder.svg"}
                          alt={category.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <h3 className="font-medium text-sm">{category.name}</h3>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>

          {/* Featured Stores */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Featured Stores</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {demoStores.slice(0, 3).map((store) => (
                <Link key={store.id} href={`/customer/store/${store.id}`}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <div className="aspect-video relative overflow-hidden">
                      <img
                        src={store.image || "/placeholder.svg"}
                        alt={store.name}
                        className="w-full h-full object-cover"
                      />
                      {store.featured && <Badge className="absolute top-3 left-3">Featured</Badge>}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-lg mb-1">{store.name}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{store.category}</p>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span>{store.rating}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{store.deliveryTime}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>

          {/* Popular Products */}
          <div>
            <h2 className="text-2xl font-bold mb-4">Popular Products</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {demoProducts.map((product) => (
                <Card key={product.id} className="hover:shadow-lg transition-shadow">
                  <div className="aspect-square relative overflow-hidden">
                    <img
                      src={product.image || "/placeholder.svg"}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-1">{product.name}</h3>
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{product.description}</p>
                    <div className="flex items-center gap-1 mb-2">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm">{product.rating}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-primary">${product.price}</span>
                      {cartItems[product.id] > 0 ? (
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => removeFromCart(product.id)}>
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="font-semibold">{cartItems[product.id]}</span>
                          <Button variant="outline" size="sm" onClick={() => addToCart(product.id)}>
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      ) : (
                        <Button size="sm" onClick={() => addToCart(product.id)}>
                          <Plus className="w-3 h-3 mr-1" />
                          Add
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Desktop Cart Sidebar */}
        <CustomerCartSidebar
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          cartProducts={getCartProducts()}
          onUpdateQuantity={(productId, quantity) => {
            setCartItems((prev) => ({ ...prev, [productId]: quantity }))
          }}
          onRemoveItem={(productId) => {
            setCartItems((prev) => {
              const newCart = { ...prev }
              delete newCart[productId]
              return newCart
            })
          }}
          className="hidden md:block"
        />
      </div>
    </div>
  )
}
