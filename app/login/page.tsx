"use client"

import type React from "react"
import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/lib/auth-context"
import { Mail, Lock } from "lucide-react"
import { motion } from "framer-motion"
import { AuthAnimationCard } from "@/components/auth-animation-card"

function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const { login, user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams?.get("callbackUrl") || "/"

  // If user is already logged in, redirect to the callback URL or home
  useEffect(() => {
    if (user) {
      router.push(callbackUrl)
    }
  }, [user, router, callbackUrl])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    const result = await login(email, password)

    if (result.success) {
      router.push(callbackUrl)
    } else {
      setError(result.error || "Login failed")
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
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-2xl font-bold text-slate-900">Welcome Back</CardTitle>
              <CardDescription className="text-sm text-slate-600">
                Sign in to your Sports Scoring account
              </CardDescription>
            </CardHeader>
            
            <CardContent className="pt-0">
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive" className="py-2">
                    <AlertDescription className="text-xs">{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-9 h-10 text-sm border-slate-200 focus:border-slate-400 focus:ring-slate-400"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-slate-700">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-9 h-10 text-sm border-slate-200 focus:border-slate-400 focus:ring-slate-400"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-10 text-base font-semibold bg-slate-900 hover:bg-slate-800 text-white mt-6"
                  disabled={loading}
                >
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-slate-600">
                  Don't have an account?{" "}
                  <Link href="/signup" className="text-slate-900 hover:text-slate-700 font-semibold hover:underline">
                    Sign up
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

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
