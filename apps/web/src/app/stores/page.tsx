"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Star, Clock, DollarSign, MapPin, Filter } from "lucide-react"
import { demoStores } from "@/components/shared/demo-data"

export default function StoresPage() {
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid")

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">Stores Near You</h1>
          <p className="text-muted-foreground">Choose from {demoStores.length}+ amazing stores</p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input placeholder="Search stores..." className="pl-10 h-12 text-base" />
          </div>

          <div className="flex flex-wrap gap-4 items-center">
            <Select>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="food">Food & Restaurants</SelectItem>
                <SelectItem value="pharmacy">Pharmacy</SelectItem>
                <SelectItem value="electronics">Electronics</SelectItem>
              </SelectContent>
            </Select>

            <Select>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rating">Highest Rated</SelectItem>
                <SelectItem value="delivery-time">Fastest Delivery</SelectItem>
                <SelectItem value="delivery-fee">Lowest Delivery Fee</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              More Filters
            </Button>

            <div className="ml-auto flex gap-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("grid")}
              >
                Grid
              </Button>
              <Button variant={viewMode === "map" ? "default" : "outline"} size="sm" onClick={() => setViewMode("map")}>
                Map
              </Button>
            </div>
          </div>
        </div>

        {/* Stores Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {demoStores.map((store) => (
            <Link key={store.id} href={`/store/${store.id}`}>
              <Card className="group hover:shadow-lg transition-all duration-200 hover:-translate-y-1 cursor-pointer overflow-hidden">
                <div className="aspect-video relative overflow-hidden">
                  <img
                    src={store.image || "/placeholder.svg"}
                    alt={store.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  {store.featured && (
                    <Badge className="absolute top-3 left-3 bg-accent text-accent-foreground">Featured</Badge>
                  )}
                  <div
                    className={`absolute top-3 right-3 w-3 h-3 rounded-full ${store.isOpen ? "bg-green-500" : "bg-red-500"}`}
                  />
                </div>

                <CardContent className="p-4">
                  <div className="mb-2">
                    <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                      {store.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">{store.category}</p>
                  </div>

                  <div className="flex items-center gap-1 mb-3">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">{store.rating}</span>
                    <span className="text-sm text-muted-foreground">({store.reviewCount})</span>
                  </div>

                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{store.deliveryTime}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        <span>${store.deliveryFee} delivery</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>Min. order ${store.minimumOrder}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
