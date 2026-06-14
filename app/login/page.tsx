"use client"

import type React from "react"
import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/lib/auth-context"
import { Mail, Lock, Trophy, Eye, EyeOff, Flame, Users, BarChart3, ArrowRight } from "lucide-react"
import { motion } from "framer-motion"

function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const { login, user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams?.get("callbackUrl") || "/"

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
    <div className="auth-page min-h-screen flex overflow-hidden fixed inset-0 bg-[#fafbfc]">
      {/* Subtle grid */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: `linear-gradient(rgba(15,23,42,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.02) 1px, transparent 1px)`,
        backgroundSize: '64px 64px'
      }} />

      {/* Left - Form */}
      <div className="relative w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-[420px]"
        >
          {/* Logo */}
          <div className="flex items-center gap-2.5 mb-10">
            <div className="h-9 w-9 rounded-lg bg-slate-900 flex items-center justify-center">
              <Trophy className="h-4.5 w-4.5 text-white" />
            </div>
            <span className="text-lg font-semibold text-slate-900 tracking-tight">Sports Scoring</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
            <p className="text-sm text-slate-500 mt-1.5">Sign in to continue to your dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <Alert variant="destructive" className="py-2.5 rounded-xl text-sm">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium text-slate-700">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-11 text-sm rounded-xl border-slate-200 bg-white focus:border-slate-400 focus:ring-slate-400/20"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium text-slate-700">Password</Label>
                <button type="button" className="text-xs text-slate-500 hover:text-slate-700 font-medium transition-colors">
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-11 text-sm rounded-xl border-slate-200 bg-white focus:border-slate-400 focus:ring-slate-400/20"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400/20"
              />
              <Label htmlFor="remember" className="text-sm text-slate-600 cursor-pointer">Remember me</Label>
            </div>

            <Button
              type="submit"
              className="w-full h-11 text-sm font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-lg shadow-slate-900/10 transition-all duration-300 hover:-translate-y-0.5"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </div>
              ) : "Sign In"}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-500">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-slate-900 font-semibold hover:underline underline-offset-2">
              Sign up
            </Link>
          </p>
        </motion.div>
      </div>

      {/* Right - Visual Panel */}
      <div className="hidden lg:flex w-1/2 items-center justify-center relative overflow-hidden bg-slate-900">
        {/* Grid overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.04]" style={{
          backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
          backgroundSize: '48px 48px'
        }} />
        {/* Glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="relative text-center max-w-sm px-8"
        >
          <div className="flex justify-center gap-3 mb-8">
            {[Flame, Users, BarChart3].map((Icon, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + i * 0.12 }}
                className="h-12 w-12 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-center"
              >
                <Icon className="h-5 w-5 text-white/70" />
              </motion.div>
            ))}
          </div>

          <h2 className="text-2xl font-bold text-white mb-3">
            Score every game,<br />track every stat.
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Real-time scoring across Cricket, Volleyball, Chess,
            Futsal, Table Tennis and Badminton.
          </p>

          <div className="flex items-center justify-center gap-6 mt-10">
            {[
              { value: "6", label: "Sports" },
              { value: "Live", label: "Updates" },
              { value: "Free", label: "To use" },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-lg font-bold text-white">{stat.value}</div>
                <div className="text-[10px] text-slate-500 uppercase tracking-widest">{stat.label}</div>
              </div>
            ))}
          </div>
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
