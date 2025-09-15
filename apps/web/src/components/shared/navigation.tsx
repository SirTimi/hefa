"use client"

import Link from "next/link"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ShoppingCart, Heart, Search, ShoppingBag, Menu, X } from "lucide-react"

export function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Left side: Logo + Brand name */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl">Hefa</span>
          </Link>

          {/* Right side */}
          <div className="flex items-center space-x-2">
            {/* Search is always visible */}
            <Button asChild variant="ghost" size="sm" className="hidden sm:flex">
              <Link href="/categories">
                <Search className="w-5 h-5 mr-1" />
                Search
              </Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="sm:hidden"
            >
              <Link href="/categories">
                <Search className="w-5 h-5" />
              </Link>
            </Button>

            {/* Desktop menu */}
            <div className="hidden md:flex items-center space-x-4">
              <Link
                href="/cart"
                className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ShoppingCart className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  2
                </span>
              </Link>


              <button className="p-2 text-gray-600 hover:text-gray-900 transition-colors">
                <Heart className="w-5 h-5" />
              </button>

              <Button asChild variant="ghost" size="sm">
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/register">Sign Up</Link>
              </Button>
            </div>

            {/* Mobile Hamburger */}
            <button
              className="md:hidden p-2 text-gray-700 hover:text-gray-900"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-background">
          <div className="px-4 py-4 space-y-4">
            <Link
              href="/cart"
              className="flex items-center space-x-2 text-gray-700 hover:text-primary"
            >
              <ShoppingCart className="w-5 h-5" />
              <span>Cart</span>
            </Link>

            <Link
              href="/wishlist"
              className="flex items-center space-x-2 text-gray-700 hover:text-primary"
            >
              <Heart className="w-5 h-5" />
              <span>Wishlist</span>
            </Link>

            <Link
              href="/login"
              className="block w-full text-left text-gray-700 hover:text-primary"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="block w-full text-left text-gray-700 hover:text-primary"
            >
              Sign Up
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}
