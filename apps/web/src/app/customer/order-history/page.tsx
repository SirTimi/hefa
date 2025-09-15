"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Search, Clock, Star, RotateCcw } from "lucide-react"

export default function OrderHistory() {
  const orders = [
    {
      id: "ORD-12345",
      date: "2024-01-15",
      status: "delivered",
      store: "Pizza Palace",
      items: ["Margherita Pizza (Medium)", "Garlic Bread"],
      total: 47.47,
      rating: 5,
    },
    {
      id: "ORD-12344",
      date: "2024-01-12",
      status: "delivered",
      store: "HealthCare Pharmacy",
      items: ["Paracetamol 500mg", "Vitamin C Tablets"],
      total: 15.99,
      rating: 4,
    },
    {
      id: "ORD-12343",
      date: "2024-01-10",
      status: "cancelled",
      store: "TechHub Electronics",
      items: ["Wireless Headphones"],
      total: 89.99,
      rating: null,
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-100 text-green-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button asChild variant="ghost" size="sm">
              <Link href="/customer/home">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Link>
            </Button>
            <h1 className="text-2xl font-bold">Order History</h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input placeholder="Search orders..." className="pl-10" />
          </div>

          {/* Orders List */}
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Order #{order.id}</CardTitle>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {new Date(order.date).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-1">{order.store}</h3>
                    <div className="text-sm text-muted-foreground">{order.items.join(", ")}</div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-lg font-bold">${order.total.toFixed(2)}</div>
                    {order.rating && (
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">{order.rating}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {order.status === "delivered" && (
                      <>
                        <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                          <RotateCcw className="w-4 h-4 mr-2" />
                          Reorder
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                          View Details
                        </Button>
                      </>
                    )}
                    {order.status === "cancelled" && (
                      <Button variant="outline" size="sm" className="w-full bg-transparent">
                        View Details
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Empty State */}
          {orders.length === 0 && (
            <div className="text-center py-12">
              <Clock className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No orders yet</h3>
              <p className="text-muted-foreground mb-6">Start shopping to see your order history here</p>
              <Button asChild>
                <Link href="/customer/home">Start Shopping</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
