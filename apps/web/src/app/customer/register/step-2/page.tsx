"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { ArrowRight, MapPin, CreditCard } from "lucide-react"

export default function CustomerRegisterStep2() {
  const [formData, setFormData] = useState({
    address: "",
    city: "",
    paymentMethod: "mpesa",
  })

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Setup Profile</CardTitle>
          <p className="text-muted-foreground">Step 2 of 2 - Address & Payment</p>
          <Progress value={100} className="mt-4" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address">Default Address</Label>
            <Textarea
              id="address"
              placeholder="Enter your home address"
              rows={3}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              placeholder="Enter your city"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Preferred Payment Method</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={formData.paymentMethod === "mpesa" ? "default" : "outline"}
                className="h-12"
                onClick={() => setFormData({ ...formData, paymentMethod: "mpesa" })}
              >
                M-Pesa
              </Button>
              <Button
                variant={formData.paymentMethod === "card" ? "default" : "outline"}
                className="h-12"
                onClick={() => setFormData({ ...formData, paymentMethod: "card" })}
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Card
              </Button>
            </div>
          </div>

          <Button asChild className="w-full" size="lg">
            <Link href="/customer/home">
              Complete Registration
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/customer/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
