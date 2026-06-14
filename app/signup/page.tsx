"use client"

import type React from "react"
import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/lib/auth-context"
import { User, Mail, Lock, Phone, Trophy, Eye, EyeOff, Check, X, Shield, Flame, Users, BarChart3, Calendar } from "lucide-react"
import { motion } from "framer-motion"

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
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const { signup } = useAuth()
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  // Password strength calculation
  const passwordStrength = useMemo(() => {
    const pw = formData.password
    if (!pw) return { level: 0, label: "", color: "" }
    let score = 0
    if (pw.length >= 6) score++
    if (pw.length >= 10) score++
    if (/[A-Z]/.test(pw)) score++
    if (/[0-9]/.test(pw)) score++
    if (/[^A-Za-z0-9]/.test(pw)) score++

    if (score <= 1) return { level: 1, label: "Weak", color: "bg-red-500" }
    if (score <= 2) return { level: 2, label: "Fair", color: "bg-orange-500" }
    if (score <= 3) return { level: 3, label: "Good", color: "bg-yellow-500" }
    if (score <= 4) return { level: 4, label: "Strong", color: "bg-green-500" }
    return { level: 5, label: "Very Strong", color: "bg-emerald-500" }
  }, [formData.password])

  const passwordsMatch = formData.password && formData.confirm_password && formData.password === formData.confirm_password

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

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

  const features = [
    { title: "Live Scoring", desc: "Real-time updates across 6 sports", Icon: Flame },
    { title: "Team Management", desc: "Build and manage your squads", Icon: Users },
    { title: "Analytics", desc: "Deep performance insights", Icon: BarChart3 },
    { title: "Tournaments", desc: "Organize brackets & fixtures", Icon: Calendar },
  ]

  return (
    <div className="auth-page min-h-screen flex overflow-hidden fixed inset-0 bg-[#fafbfc]">
      {/* Subtle grid */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: `linear-gradient(rgba(15,23,42,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.02) 1px, transparent 1px)`,
        backgroundSize: '64px 64px'
      }} />

      {/* Left side - Form */}
      <div className="relative w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-10 z-10 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          {/* Logo */}
          <div className="flex items-center gap-2.5 mb-6">
            <div className="h-9 w-9 rounded-lg bg-slate-900 flex items-center justify-center">
              <Trophy className="h-4.5 w-4.5 text-white" />
            </div>
            <span className="text-lg font-semibold text-slate-900 tracking-tight">Sports Scoring</span>
          </div>

          {/* Form Card */}
          <div className="relative">
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-7">
              <div className="mb-5">
                <h1 className="text-2xl font-bold text-slate-900">Create Account</h1>
                <p className="text-sm text-slate-500 mt-1">Start tracking your sports performance</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive" className="py-2 rounded-xl">
                    <AlertDescription className="text-xs">{error}</AlertDescription>
                  </Alert>
                )}

                {/* Section: Personal Info */}
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Personal Info</p>

                  <div className="space-y-1.5">
                    <Label htmlFor="full_name" className="text-xs font-medium text-slate-700">Full Name</Label>
                    <div className="relative group">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-slate-600 transition-colors" />
                      <Input id="full_name" name="full_name" type="text" placeholder="John Doe" value={formData.full_name} onChange={handleChange} className="pl-9 h-10 text-sm rounded-xl border-slate-200 bg-white/80 focus:border-slate-400 focus:ring-slate-400/20" required />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="username" className="text-xs font-medium text-slate-700">Username</Label>
                      <div className="relative group">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 group-focus-within:text-slate-600 transition-colors">@</span>
                        <Input id="username" name="username" type="text" placeholder="johndoe" value={formData.username} onChange={handleChange} className="pl-8 h-10 text-sm rounded-xl border-slate-200 bg-white/80 focus:border-slate-400 focus:ring-slate-400/20" required />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="phone_number" className="text-xs font-medium text-slate-700">
                        Phone <span className="text-slate-400">(Optional)</span>
                      </Label>
                      <div className="relative group">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-slate-600 transition-colors" />
                        <Input id="phone_number" name="phone_number" type="tel" placeholder="+1 234 567" value={formData.phone_number} onChange={handleChange} className="pl-9 h-10 text-sm rounded-xl border-slate-200 bg-white/80 focus:border-slate-400 focus:ring-slate-400/20" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section: Account */}
                <div className="space-y-3 pt-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Account Details</p>

                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-xs font-medium text-slate-700">Email</Label>
                    <div className="relative group">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-slate-600 transition-colors" />
                      <Input id="email" name="email" type="email" placeholder="you@example.com" value={formData.email} onChange={handleChange} className="pl-9 h-10 text-sm rounded-xl border-slate-200 bg-white/80 focus:border-slate-400 focus:ring-slate-400/20" required />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="password" className="text-xs font-medium text-slate-700">Password</Label>
                    <div className="relative group">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-slate-600 transition-colors" />
                      <Input id="password" name="password" type={showPassword ? "text" : "password"} placeholder="Min 6 characters" value={formData.password} onChange={handleChange} className="pl-9 pr-10 h-10 text-sm rounded-xl border-slate-200 bg-white/80 focus:border-slate-400 focus:ring-slate-400/20" required />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>

                    {/* Password Strength Bar */}
                    {formData.password && (
                      <div className="space-y-1">
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((level) => (
                            <div
                              key={level}
                              className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                                level <= passwordStrength.level ? passwordStrength.color : "bg-slate-200"
                              }`}
                            />
                          ))}
                        </div>
                        <p className={`text-[10px] font-medium ${
                          passwordStrength.level <= 1 ? "text-red-500" :
                          passwordStrength.level <= 2 ? "text-orange-500" :
                          passwordStrength.level <= 3 ? "text-yellow-600" :
                          "text-green-600"
                        }`}>
                          {passwordStrength.label}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="confirm_password" className="text-xs font-medium text-slate-700">Confirm Password</Label>
                    <div className="relative group">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-slate-600 transition-colors" />
                      <Input id="confirm_password" name="confirm_password" type={showConfirmPassword ? "text" : "password"} placeholder="Confirm your password" value={formData.confirm_password} onChange={handleChange} className="pl-9 pr-10 h-10 text-sm rounded-xl border-slate-200 bg-white/80 focus:border-slate-400 focus:ring-slate-400/20" required />
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                      {formData.confirm_password && (
                        <div className="absolute right-10 top-1/2 -translate-y-1/2">
                          {passwordsMatch ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <X className="h-4 w-4 text-red-400" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 text-sm font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-lg shadow-slate-900/10 transition-all duration-300 hover:-translate-y-0.5 mt-2"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating Account...
                    </div>
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </form>

              <div className="mt-4 text-center">
                <p className="text-xs text-slate-500">
                  Already have an account?{" "}
                  <Link href="/login" className="text-slate-900 font-semibold hover:underline underline-offset-2">
                    Sign in
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Right - Visual Panel */}
      <div className="hidden lg:flex w-1/2 items-center justify-center relative overflow-hidden bg-slate-900">
        {/* Grid overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.04]" style={{
          backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
          backgroundSize: '48px 48px'
        }} />
        <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="relative max-w-sm px-8"
        >
          <div className="space-y-4 mb-10">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.12, duration: 0.5 }}
                className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm"
              >
                <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                  <feature.Icon className="h-5 w-5 text-white/70" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">{feature.title}</h3>
                  <p className="text-xs text-slate-400">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="flex items-center justify-center gap-2 text-xs text-slate-500"
          >
            <Shield className="h-3.5 w-3.5" />
            <span>Your data is secure and encrypted</span>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
