"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/lib/auth-context"
import { User, Mail, Lock, Phone } from "lucide-react"
import { motion } from "framer-motion"
import { AuthAnimationCard } from "@/components/auth-animation-card"

export default function SignupPage() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    full_name: "",
    phone_number: "",
    password: "",
    confirm_password: "",
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const { signup } = useAuth()
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    // Validation
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters")
      setLoading(false)
      return
    }

    if (formData.password !== formData.confirm_password) {
      setError("Passwords do not match")
      setLoading(false)
      return
    }

    const result = await signup({
      username: formData.username,
      email: formData.email,
      full_name: formData.full_name,
      phone_number: formData.phone_number || undefined,
      password: formData.password,
      confirm_password: formData.confirm_password,
    })

    if (result.success) {
      router.push("/")
    } else {
      setError(result.error || "Signup failed")
    }

    setLoading(false)
  }

  return (
    <div className="auth-page h-screen flex overflow-hidden bg-white fixed inset-0">
      {/* Left side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card className="border border-slate-200 shadow-lg bg-white">
            <CardHeader className="space-y-0.5 pb-2">
              <CardTitle className="text-2xl font-bold text-slate-900">Create Account</CardTitle>
              <CardDescription className="text-xs text-slate-600">
                Sign up to start tracking your sports performance
              </CardDescription>
            </CardHeader>
            
            <CardContent className="pt-0">
              <form onSubmit={handleSubmit} className="space-y-2.5">
                {error && (
                  <Alert variant="destructive" className="py-2">
                    <AlertDescription className="text-xs">{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-1">
                  <Label htmlFor="full_name" className="text-xs font-medium text-slate-700">
                    Full Name
                  </Label>
                  <div className="relative">
                    <User className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <Input
                      id="full_name"
                      name="full_name"
                      type="text"
                      placeholder="Enter your full name"
                      value={formData.full_name}
                      onChange={handleChange}
                      className="pl-8 h-8 text-xs border-slate-200 focus:border-slate-400 focus:ring-slate-400"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="username" className="text-xs font-medium text-slate-700">
                    Username
                  </Label>
                  <div className="relative">
                    <User className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <Input
                      id="username"
                      name="username"
                      type="text"
                      placeholder="Choose a username"
                      value={formData.username}
                      onChange={handleChange}
                      className="pl-8 h-8 text-xs border-slate-200 focus:border-slate-400 focus:ring-slate-400"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="email" className="text-xs font-medium text-slate-700">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={handleChange}
                      className="pl-8 h-8 text-xs border-slate-200 focus:border-slate-400 focus:ring-slate-400"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="phone_number" className="text-xs font-medium text-slate-700">
                    Phone Number <span className="text-slate-400 font-normal">(Optional)</span>
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <Input
                      id="phone_number"
                      name="phone_number"
                      type="tel"
                      placeholder="Enter your phone number"
                      value={formData.phone_number}
                      onChange={handleChange}
                      className="pl-8 h-8 text-xs border-slate-200 focus:border-slate-400 focus:ring-slate-400"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="password" className="text-xs font-medium text-slate-700">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="Min 6 characters"
                      value={formData.password}
                      onChange={handleChange}
                      className="pl-8 h-8 text-xs border-slate-200 focus:border-slate-400 focus:ring-slate-400"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="confirm_password" className="text-xs font-medium text-slate-700">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <Input
                      id="confirm_password"
                      name="confirm_password"
                      type="password"
                      placeholder="Confirm your password"
                      value={formData.confirm_password}
                      onChange={handleChange}
                      className="pl-8 h-8 text-xs border-slate-200 focus:border-slate-400 focus:ring-slate-400"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-9 text-sm font-semibold bg-slate-900 hover:bg-slate-800 text-white mt-3"
                  disabled={loading}
                >
                  {loading ? "Creating Account..." : "Create Account"}
                </Button>
              </form>

              <div className="mt-3 text-center">
                <p className="text-xs text-slate-600">
                  Already have an account?{" "}
                  <Link href="/login" className="text-slate-900 hover:text-slate-700 font-semibold hover:underline">
                    Sign in
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Right side - Animation Card */}
      <div className="hidden lg:flex w-1/2 items-center justify-center p-8 bg-white">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full h-full flex items-center justify-center max-w-2xl"
        >
          <AuthAnimationCard />
        </motion.div>
      </div>
    </div>
  )
}
