"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Plus, Minus, X, ShoppingBag } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface CartProduct {
  id: string
  name: string
  price: number
  image?: string
  storeName?: string
  quantity: number
}

interface CustomerCartSidebarProps {
  isOpen?: boolean
  onClose?: () => void
  cartProducts: CartProduct[]
  onUpdateQuantity: (productId: string, quantity: number) => void
  onRemoveItem: (productId: string) => void
  className?: string
}

export function CustomerCartSidebar({
  isOpen = true,
  onClose,
  cartProducts,
  onUpdateQuantity,
  onRemoveItem,
  className,
}: CustomerCartSidebarProps) {
  const subtotal = cartProducts.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const deliveryFee = 2.5
  const total = subtotal + deliveryFee

  if (cartProducts.length === 0) {
    return (
      <div
        className={cn(
          "w-80 bg-background border-l transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "translate-x-full",
          className,
        )}
      >
        <div className="p-6 h-full flex flex-col items-center justify-center">
          <ShoppingBag className="w-16 h-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Your cart is empty</h3>
          <p className="text-muted-foreground text-center mb-4">Add some delicious items to get started</p>
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              Continue Shopping
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "w-80 bg-background border-l transition-transform duration-300 ease-in-out fixed right-0 top-0 h-full z-50 overflow-y-auto",
        isOpen ? "translate-x-0" : "translate-x-full",
        className,
      )}
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Cart ({cartProducts.length})</h2>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Cart Items */}
        <div className="space-y-4 mb-6">
          {cartProducts.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-4">
                <div className="flex gap-3">
                  <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={item.image || "/placeholder.svg"}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-medium text-sm truncate">{item.name}</h3>
                        {item.storeName && <p className="text-xs text-muted-foreground">{item.storeName}</p>}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemoveItem(item.id)}
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                          className="h-6 w-6 p-0"
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                          className="h-6 w-6 p-0"
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                      <span className="font-semibold text-sm">${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Order Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Delivery fee</span>
              <span>${deliveryFee.toFixed(2)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>

            <Button asChild className="w-full" size="lg">
              <Link href="/customer/checkout">Checkout</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
