"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Clock, MapPin, Phone, User, CheckCircle } from "lucide-react"

export default function OrderTracking() {
  const [currentStep, setCurrentStep] = useState(2)

  const orderSteps = [
    { id: 1, title: "Order Placed", description: "Your order has been confirmed", completed: true },
    { id: 2, title: "Preparing", description: "Restaurant is preparing your order", completed: true },
    { id: 3, title: "Ready for Pickup", description: "Order is ready for driver pickup", completed: false },
    { id: 4, title: "Out for Delivery", description: "Driver is on the way to you", completed: false },
    { id: 5, title: "Delivered", description: "Order has been delivered", completed: false },
  ]

  const orderDetails = {
    id: "ORD-12345",
    estimatedTime: "15 minutes",
    store: {
      name: "Pizza Palace",
      phone: "+254 700 123 456",
      address: "456 Business Ave, Westlands",
    },
    driver: {
      name: "Mike Johnson",
      phone: "+254 700 987 654",
      rating: 4.9,
      vehicle: "Motorcycle - KCA 123A",
    },
    deliveryAddress: "123 Main Street, Westlands, Nairobi",
  }

  // Simulate order progress
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < 5) return prev + 1
        return prev
      })
    }, 10000) // Progress every 10 seconds for demo

    return () => clearInterval(timer)
  }, [])

  const getProgressPercentage = () => {
    return (currentStep / orderSteps.length) * 100
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
            <h1 className="text-2xl font-bold">Track Order</h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Order Status */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Order #{orderDetails.id}</CardTitle>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  In Progress
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>Estimated arrival: {orderDetails.estimatedTime}</span>
              </div>

              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span>{orderDetails.deliveryAddress}</span>
              </div>

              <Progress value={getProgressPercentage()} className="mt-4" />
            </CardContent>
          </Card>

          {/* Order Progress */}
          <Card>
            <CardHeader>
              <CardTitle>Order Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {orderSteps.map((step, index) => (
                  <div key={step.id} className="flex items-start gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        step.id <= currentStep ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {step.id <= currentStep ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <span className="text-sm font-medium">{step.id}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3
                        className={`font-medium ${
                          step.id <= currentStep ? "text-foreground" : "text-muted-foreground"
                        }`}
                      >
                        {step.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                      {step.id === currentStep && (
                        <Badge variant="secondary" className="mt-1 bg-blue-100 text-blue-800">
                          Current
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Store Info */}
          <Card>
            <CardHeader>
              <CardTitle>Store Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{orderDetails.store.name}</h3>
                  <p className="text-sm text-muted-foreground">{orderDetails.store.address}</p>
                </div>
                <Button variant="outline" size="sm">
                  <Phone className="w-4 h-4 mr-2" />
                  Call Store
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Driver Info */}
          {currentStep >= 4 && (
            <Card>
              <CardHeader>
                <CardTitle>Driver Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">{orderDetails.driver.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        ⭐ {orderDetails.driver.rating} • {orderDetails.driver.vehicle}
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    <Phone className="w-4 h-4 mr-2" />
                    Call Driver
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            {currentStep === 5 ? (
              <>
                <Button asChild className="w-full" size="lg">
                  <Link href="/customer/order-history">View Order History</Link>
                </Button>
                <Button asChild variant="outline" className="w-full bg-transparent">
                  <Link href="/customer/home">Order Again</Link>
                </Button>
              </>
            ) : (
              <Button asChild variant="outline" className="w-full bg-transparent">
                <Link href="/customer/home">Continue Shopping</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
