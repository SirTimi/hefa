"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Smartphone, ArrowRight } from "lucide-react"

export default function RegisterPage() {
  const [step, setStep] = useState<"phone" | "otp" | "profile">("phone")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [otp, setOtp] = useState("")

  const handleSendOTP = () => {
    setStep("otp")
  }

  const handleVerifyOTP = () => {
    setStep("profile")
  }

  const handleCompleteRegistration = () => {
    // Redirect to categories page after registration
    window.location.href = "/"
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Smartphone className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">
            {step === "phone" && "Create Account"}
            {step === "otp" && "Verify Phone"}
            {step === "profile" && "Complete Profile"}
          </CardTitle>
          <CardDescription>
            {step === "phone" && "Enter your phone number to get started"}
            {step === "otp" && "Enter the verification code sent to your phone"}
            {step === "profile" && "Tell us a bit about yourself"}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {step === "phone" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Select defaultValue="us">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="us">🇺🇸 United States (+1)</SelectItem>
                    <SelectItem value="ke">🇰🇪 Kenya (+254)</SelectItem>
                    <SelectItem value="ng">🇳🇬 Nigeria (+234)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
              </div>

              <Button className="w-full" onClick={handleSendOTP} disabled={!phoneNumber}>
                Send Verification Code
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </>
          )}

          {step === "otp" && (
            <>
              <div className="text-center mb-4">
                <p className="text-sm text-muted-foreground">
                  We sent a 6-digit code to
                  <br />
                  <span className="font-medium">{phoneNumber}</span>
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="otp">Verification Code</Label>
                <Input
                  id="otp"
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength={6}
                  className="text-center text-lg tracking-widest"
                />
              </div>

              <Button className="w-full" onClick={handleVerifyOTP} disabled={otp.length !== 6}>
                Verify Code
              </Button>

              <div className="text-center">
                <Button variant="ghost" size="sm">
                  Resend code in 30s
                </Button>
              </div>
            </>
          )}

          {step === "profile" && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" placeholder="John" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" placeholder="Doe" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email (Optional)</Label>
                <Input id="email" type="email" placeholder="john@example.com" />
              </div>

              <Button className="w-full" onClick={handleCompleteRegistration}>
                Complete Registration
              </Button>
            </>
          )}

          <div className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
