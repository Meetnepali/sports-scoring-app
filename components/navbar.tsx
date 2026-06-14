"use client"

import Link from "next/link"
import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Trophy, Users, Calendar, Home, PlusCircle, User, LogOut, BarChart3, Menu, Bell, X } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { motion } from "framer-motion"
import { usePathname } from "next/navigation"

const navLinks = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/matches", icon: Calendar, label: "Matches" },
  { href: "/teams", icon: Users, label: "Teams" },
  { href: "/tournaments", icon: Trophy, label: "Tournaments" },
]

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth()
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 12)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleLogout = async () => {
    await logout()
    window.location.href = "/login"
  }

  const initials = useMemo(() => {
    if (!user?.full_name) return user?.username?.slice(0, 2)?.toUpperCase() || "U"
    return user.full_name
      .split(" ")
      .map((part: string) => part.charAt(0))
      .join("")
      .slice(0, 2)
      .toUpperCase()
  }, [user])

  const headerClasses = scrolled
    ? "bg-white/90 shadow-[0_18px_40px_rgba(15,23,42,0.08)] backdrop-blur-xl"
    : "bg-white/65 backdrop-blur-xl"

  if (!user) {
    return (
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.45 }}
        className="sticky top-0 z-50 w-full border-b border-transparent transition-all duration-300"
      >
        <div className="container px-4 pt-4">
          <div className={`flex h-16 items-center justify-between rounded-full border border-white/45 bg-white/80 px-4 shadow-[0_12px_30px_rgba(15,23,42,0.08)] backdrop-blur-xl transition-all duration-300 ${headerClasses}`}>
            <Link href="/" className="flex items-center gap-3">
              <motion.div whileHover={{ rotate: 360 }} transition={{ duration: 0.6 }}>
                <div className="h-8 w-8 rounded-lg bg-slate-900 flex items-center justify-center">
                  <Trophy className="h-4 w-4 text-white" />
                </div>
              </motion.div>
              <span className="text-base font-semibold tracking-tight text-slate-900">
                Sports Scoring
              </span>
            </Link>
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition-all duration-300 hover:border-slate-300 hover:text-slate-900"
                >
                  Sign in
                </Button>
              </Link>
              <Link href="/signup">
                <Button
                  size="sm"
                  className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-all duration-300 hover:bg-slate-800 shadow-lg shadow-slate-900/10"
                >
                  Get started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </motion.header>
    )
  }

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.45 }}
      className="sticky top-0 z-50 w-full border-b border-transparent bg-background transition-all duration-300"
    >
      <div className="container px-4 pt-4 bg-background transition-all duration-300">
        <div className={`relative flex h-16 w-full items-center gap-4 rounded-xl px-4 shadow-[0_12px_30px_rgba(15,23,42,0.08)] backdrop-blur-xl transition-all duration-300 ${headerClasses}`}>
          <Link href="/" className="flex items-center gap-3">
            <motion.div whileHover={{ rotate: 360 }} transition={{ duration: 0.6 }}>
              <div className="h-8 w-8 rounded-lg bg-slate-900 flex items-center justify-center">
                <Trophy className="h-4 w-4 text-white" />
              </div>
            </motion.div>
            <span className="hidden text-base font-semibold tracking-tight text-slate-900 sm:inline">
              Sports Scoring
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-1 rounded-full bg-slate-100/60 p-1 md:flex">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || (link.href !== "/" && pathname?.startsWith(link.href))
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`group relative flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 ${
                    isActive
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:bg-white hover:text-slate-900"
                  }`}
                >
                  <link.icon className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
                  <span>{link.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-6 rounded-full bg-slate-900"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Right Controls */}
          <div className="ml-auto flex items-center gap-3">
            {isAdmin && (
              <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-2 py-1 shadow-sm lg:flex">
                <Link
                  href="/teams/create"
                  className="flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold text-slate-600 transition-colors duration-300 hover:text-slate-900"
                >
                  <PlusCircle className="h-4 w-4" />
                  Team
                </Link>
                <span className="h-4 w-px bg-slate-200" />
                <Link
                  href="/matches/create"
                  className="flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold text-slate-600 transition-colors duration-300 hover:text-slate-900"
                >
                  <PlusCircle className="h-4 w-4" />
                  Match
                </Link>
                <span className="h-4 w-px bg-slate-200" />
                <Link
                  href="/tournaments/create"
                  className="flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold text-slate-600 transition-colors duration-300 hover:text-slate-900"
                >
                  <PlusCircle className="h-4 w-4" />
                  Tournament
                </Link>
              </div>
            )}

            {/* Notification bell placeholder */}
            <Button
              variant="ghost"
              size="icon"
              className="hidden sm:inline-flex h-9 w-9 rounded-full border border-white/60 bg-white/70 hover:bg-white"
            >
              <Bell className="h-4 w-4 text-slate-500" />
            </Button>

            {/* Avatar Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-11 w-11 rounded-full border border-white/60 bg-white/70 p-0 transition-all duration-300 hover:scale-[1.03] hover:border-slate-200 hover:bg-white"
                >
                  <Avatar className="h-11 w-11">
                    <AvatarImage src={user.avatar_url || '/placeholder.svg'} alt={user.full_name} />
                    <AvatarFallback className="bg-slate-900 text-sm font-semibold text-white">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-60 animate-slide-down rounded-3xl border border-slate-100 bg-white/95 p-2 shadow-xl backdrop-blur-xl"
                align="end"
                forceMount
              >
                <div className="rounded-2xl bg-slate-100/60 p-3">
                  <p className="text-sm font-semibold text-slate-900">{user.full_name || user.username}</p>
                  <p className="truncate text-xs text-slate-500">{user.email}</p>
                  <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-slate-400">{user.role}</p>
                </div>
                <DropdownMenuSeparator className="my-2" />
                <DropdownMenuItem asChild>
                  <Link
                    href="/profile"
                    className="flex items-center gap-2 text-sm text-slate-600 transition-colors duration-300 hover:text-slate-900"
                  >
                    <User className="h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href="/analytics"
                    className="flex items-center gap-2 text-sm text-slate-600 transition-colors duration-300 hover:text-slate-900"
                  >
                    <BarChart3 className="h-4 w-4" />
                    Analytics
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-2" />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer rounded-xl text-sm font-semibold text-rose-500 transition-colors duration-300 hover:bg-rose-50 focus:text-rose-500"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full border border-white/60 bg-white/70 hover:bg-white"
                >
                  <Menu className="h-6 w-6 text-slate-600" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 border-none bg-white/95 backdrop-blur-xl px-6 py-8">
                <div className="flex flex-col h-full">
                  {/* Mobile menu header */}
                  <div className="flex items-center gap-3 mb-8">
                    <div className="h-8 w-8 rounded-lg bg-slate-900 flex items-center justify-center">
                      <Trophy className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-base font-semibold text-slate-900">Sports Scoring</span>
                  </div>

                  {/* User info */}
                  <div className="flex items-center gap-3 mb-6 p-3 bg-slate-50 rounded-xl">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.avatar_url || '/placeholder.svg'} alt={user.full_name} />
                      <AvatarFallback className="bg-slate-900 text-xs font-semibold text-white">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{user.full_name || user.username}</p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </div>
                  </div>

                  {/* Navigation Links */}
                  <nav className="flex flex-col gap-1 flex-1">
                    {navLinks.map((link) => {
                      const isActive = pathname === link.href || (link.href !== "/" && pathname?.startsWith(link.href))
                      return (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                            isActive
                              ? "bg-slate-100 text-slate-900"
                              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                          }`}
                        >
                          <link.icon className="h-4 w-4" />
                          {link.label}
                        </Link>
                      )
                    })}
                    <Link
                      href="/analytics"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all duration-200"
                    >
                      <BarChart3 className="h-4 w-4" />
                      Analytics
                    </Link>

                    {isAdmin && (
                      <>
                        <div className="my-3 h-px bg-slate-100" />
                        <p className="px-4 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Quick Create</p>
                        <Link href="/teams/create" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50">
                          <PlusCircle className="h-4 w-4" /> New Team
                        </Link>
                        <Link href="/matches/create" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50">
                          <PlusCircle className="h-4 w-4" /> New Match
                        </Link>
                        <Link href="/tournaments/create" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50">
                          <PlusCircle className="h-4 w-4" /> New Tournament
                        </Link>
                      </>
                    )}
                  </nav>

                  {/* Logout */}
                  <button
                    onClick={() => { setMobileMenuOpen(false); handleLogout() }}
                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-rose-500 hover:bg-rose-50 transition-colors mt-4"
                  >
                    <LogOut className="h-4 w-4" />
                    Log out
                  </button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </motion.header>
  )
}
