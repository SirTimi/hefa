"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Clock, MapPin, Phone } from "lucide-react"

export default function OrderConfirmation() {
  const orderDetails = {
    id: "ORD-12345",
    status: "confirmed",
    estimatedTime: "25-30 minutes",
    total: 47.47,
    items: [
      { name: "Margherita Pizza (Medium)", quantity: 2, price: 18.99 },
      { name: "Garlic Bread", quantity: 1, price: 6.99 },
    ],
    store: {
      name: "Pizza Palace",
      phone: "+254 700 123 456",
    },
    deliveryAddress: "123 Main Street, Westlands, Nairobi",
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Success Message */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Order Confirmed!</h1>
            <p className="text-muted-foreground">
              Your order has been placed successfully. You'll receive updates via SMS.
            </p>
          </div>

          {/* Order Details */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Order #{orderDetails.id}</CardTitle>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  {orderDetails.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>Estimated delivery: {orderDetails.estimatedTime}</span>
              </div>

              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span>{orderDetails.deliveryAddress}</span>
              </div>

              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="w-4 h-4" />
                <span>
                  {orderDetails.store.name} - {orderDetails.store.phone}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {orderDetails.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <div>
                      <span className="font-medium">{item.name}</span>
                      <span className="text-muted-foreground ml-2">x{item.quantity}</span>
                    </div>
                    <span className="font-semibold">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between items-center font-bold text-lg">
                    <span>Total</span>
                    <span>${orderDetails.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button asChild className="w-full" size="lg">
              <Link href="/customer/order-tracking">Track Your Order</Link>
            </Button>

            <Button asChild variant="outline" className="w-full bg-transparent">
              <Link href="/customer/home">Continue Shopping</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
