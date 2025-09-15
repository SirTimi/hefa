"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Star, Clock, DollarSign, MapPin, Search, Plus, Minus, ShoppingCart } from "lucide-react"
import { demoStores, demoProducts } from "@/components/shared/demo-data"

export default function StorePage({ params }: { params: { id: string } }) {
  const [cartItems, setCartItems] = useState<Record<string, number>>({})
  const store = demoStores.find((s) => s.id === params.id) || demoStores[0]
  const storeProducts = demoProducts.filter((p) => p.storeId === params.id)

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

  return (
    <div className="min-h-screen bg-background">
      {/* Store Header */}
      <div className="relative h-64 overflow-hidden">
        <img src={store.image || "/placeholder.svg"} alt={store.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-6 left-6 text-white">
          <h1 className="text-3xl font-bold mb-2">{store.name}</h1>
          <p className="text-lg opacity-90">{store.category}</p>
        </div>
        <div
          className={`absolute top-6 right-6 px-3 py-1 rounded-full text-sm font-medium ${
            store.isOpen ? "bg-green-500 text-white" : "bg-red-500 text-white"
          }`}
        >
          {store.isOpen ? "Open" : "Closed"}
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Store Info */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold">{store.rating}</span>
                <span className="text-muted-foreground">({store.reviewCount} reviews)</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="w-5 h-5" />
                <span>{store.deliveryTime}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <DollarSign className="w-5 h-5" />
                <span>${store.deliveryFee} delivery fee</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="w-5 h-5" />
                <span>Min. order ${store.minimumOrder}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search Products */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input placeholder="Search products in this store..." className="pl-10 h-12 text-base" />
        </div>

        {/* Product Categories */}
        <Tabs defaultValue="all" className="mb-8">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All Items</TabsTrigger>
            <TabsTrigger value="popular">Popular</TabsTrigger>
            <TabsTrigger value="offers">Offers</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {storeProducts.map((product) => (
                <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-square relative overflow-hidden">
                    <img
                      src={product.image || "/placeholder.svg"}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                    {product.originalPrice && (
                      <Badge className="absolute top-3 left-3 bg-destructive text-destructive-foreground">Sale</Badge>
                    )}
                  </div>

                  <CardContent className="p-4">
                    <div className="mb-2">
                      <h3 className="font-semibold text-lg">{product.name}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
                    </div>

                    <div className="flex items-center gap-1 mb-3">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">{product.rating}</span>
                      <span className="text-sm text-muted-foreground">({product.reviewCount})</span>
                    </div>

                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-primary">${product.price}</span>
                        {product.originalPrice && (
                          <span className="text-sm text-muted-foreground line-through">${product.originalPrice}</span>
                        )}
                      </div>
                      <Badge variant={product.inStock ? "secondary" : "destructive"}>
                        {product.inStock ? "In Stock" : "Out of Stock"}
                      </Badge>
                    </div>

                    {cartItems[product.id] > 0 ? (
                      <div className="flex items-center justify-between">
                        <Button variant="outline" size="sm" onClick={() => removeFromCart(product.id)}>
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="font-semibold">{cartItems[product.id]}</span>
                        <Button variant="outline" size="sm" onClick={() => addToCart(product.id)}>
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button className="w-full" onClick={() => addToCart(product.id)} disabled={!product.inStock}>
                        Add to Cart
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="popular">
            <div className="text-center py-12">
              <p className="text-muted-foreground">Popular items will be shown here</p>
            </div>
          </TabsContent>

          <TabsContent value="offers">
            <div className="text-center py-12">
              <p className="text-muted-foreground">Special offers will be shown here</p>
            </div>
          </TabsContent>

          <TabsContent value="reviews">
            <div className="text-center py-12">
              <p className="text-muted-foreground">Customer reviews will be shown here</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Floating Cart Button */}
      {getTotalItems() > 0 && (
        <div className="fixed bottom-6 right-6">
          <Button asChild size="lg" className="rounded-full shadow-lg">
            <Link href="/cart">
              <ShoppingCart className="w-5 h-5 mr-2" />
              Cart ({getTotalItems()})
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}
