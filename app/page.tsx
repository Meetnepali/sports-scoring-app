"use client"

import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import {
  Trophy, Users, Calendar, BarChart3, ArrowRight, Zap, Shield, TrendingUp,
  Flame
} from "lucide-react"
import Link from "next/link"
import { LoadingSpinner } from "@/components/loading-spinner"
import { motion } from "framer-motion"
import { useState, useEffect } from "react"
import { getMatchesByStatus } from "@/lib/client-api"
import { Match } from "@/lib/static-data"
import { LiveTodaySection } from "@/components/live-today-section"
import { ResultsSection } from "@/components/results-section"
import { EnhancedFooter } from "@/components/enhanced-footer"

export default function HomePage() {
  const { user, loading } = useAuth()
  const [liveMatches, setLiveMatches] = useState<Match[]>([])
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([])
  const [completedMatches, setCompletedMatches] = useState<Match[]>([])
  const [matchesLoading, setMatchesLoading] = useState(true)

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        setMatchesLoading(true)
        const [live, upcoming, completed] = await Promise.all([
          getMatchesByStatus("live"),
          getMatchesByStatus("scheduled"),
          getMatchesByStatus("completed"),
        ])
        setLiveMatches(live.slice(0, 3))
        setUpcomingMatches(upcoming.slice(0, 3))
        setCompletedMatches(completed.slice(0, 3))
      } catch (error) {
        console.error("Error fetching matches:", error)
      } finally {
        setMatchesLoading(false)
      }
    }

    fetchMatches()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  // ─── UNAUTHENTICATED LANDING ───────────────────────────────────
  if (!user) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-[#fafbfc]">
        {/* Subtle grid background */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: `linear-gradient(rgba(15,23,42,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.02) 1px, transparent 1px)`,
          backgroundSize: '64px 64px'
        }} />

        {/* ── Hero ── */}
        <section className="relative pt-24 pb-16 lg:pt-32 lg:pb-20">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
                className="text-center"
              >
                {/* Pill badge */}
                <div className="inline-flex items-center gap-2 border border-slate-200 bg-white rounded-full px-4 py-1.5 text-[13px] font-medium text-slate-600 shadow-sm mb-8">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  Live scoring across 6 sports
                </div>

                {/* Headline */}
                <h1 className="text-[clamp(2.5rem,6vw,4.5rem)] font-extrabold leading-[1.08] tracking-tight text-slate-900 mb-6">
                  The scoreboard your
                  <br className="hidden sm:block" />
                  <span className="relative">
                    <span className="relative z-10"> games deserve</span>
                    <span className="absolute bottom-1 left-0 right-0 h-3 bg-emerald-200/60 -z-0 rounded-sm" />
                  </span>
                </h1>

                <p className="text-lg text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
                  Manage matches, track scores in real time, and analyse performance
                  across Cricket, Volleyball, Chess, Futsal, Table Tennis and Badminton
                  — all from one place.
                </p>

                {/* CTAs */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Link href="/signup">
                    <Button className="h-12 px-8 text-[15px] font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-full shadow-xl shadow-slate-900/10 transition-all duration-300 hover:-translate-y-0.5">
                      Get Started — it&apos;s free
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/login">
                    <Button variant="ghost" className="h-12 px-6 text-[15px] font-semibold text-slate-600 rounded-full hover:bg-slate-100 transition-all duration-300">
                      Sign in
                    </Button>
                  </Link>
                </div>
              </motion.div>

              {/* Stats row */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="flex items-center justify-center gap-10 sm:gap-16 mt-16"
              >
                {[
                  { value: "6", label: "Sports" },
                  { value: "Real-time", label: "Updates" },
                  { value: "Free", label: "To use" },
                ].map((stat, i) => (
                  <div key={i} className="text-center">
                    <div className="text-xl sm:text-2xl font-bold text-slate-900">{stat.value}</div>
                    <div className="text-[11px] text-slate-400 uppercase tracking-widest mt-0.5">{stat.label}</div>
                  </div>
                ))}
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── Showcase: Left-Right Sections ── */}
        <section className="py-16 lg:py-24">
          <div className="container mx-auto px-4 space-y-20 lg:space-y-32 max-w-6xl">

            {/* Row 1: Live Scoring — text left, visual right */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center"
            >
              <div>
                <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 rounded-full px-3 py-1 text-xs font-semibold mb-4">
                  <Flame className="h-3.5 w-3.5" />
                  Live Scoring
                </div>
                <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4 leading-tight">
                  Ball by ball.<br />Point by point.
                </h2>
                <p className="text-slate-500 leading-relaxed mb-6">
                  Score cricket deliveries, volleyball rallies, chess moves, futsal goals,
                  and more — all in real time. Every update streams instantly to spectators via SSE.
                </p>
                <div className="flex flex-wrap gap-2">
                  {["Cricket", "Volleyball", "Chess", "Futsal", "Table Tennis", "Badminton"].map((s) => (
                    <span key={s} className="px-3 py-1 rounded-full bg-slate-100 text-xs font-medium text-slate-600">{s}</span>
                  ))}
                </div>
              </div>

              {/* Mock scoreboard visual */}
              <div className="relative">
                <div className="bg-slate-900 rounded-2xl p-6 shadow-2xl">
                  <div className="flex items-center justify-between mb-5">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Live Match</span>
                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Live
                    </span>
                  </div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="text-center">
                      <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center mx-auto mb-2">
                        <span className="text-lg font-bold text-white">R</span>
                      </div>
                      <p className="text-xs text-slate-400">Royal XI</p>
                    </div>
                    <div className="text-center px-6">
                      <div className="text-3xl font-black text-white tracking-tight">142 <span className="text-slate-500 text-lg">/</span> <span className="text-slate-400 text-xl">5</span></div>
                      <p className="text-[10px] text-slate-500 mt-1">18.3 overs</p>
                    </div>
                    <div className="text-center">
                      <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center mx-auto mb-2">
                        <span className="text-lg font-bold text-white">S</span>
                      </div>
                      <p className="text-xs text-slate-400">Storm FC</p>
                    </div>
                  </div>
                  {/* Ball by ball row */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-500 mr-1">This over</span>
                    {["1", "0", "4", "W", "2", ""].map((b, i) => (
                      <div key={i} className={`h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        b === "4" ? "bg-emerald-500 text-white" :
                        b === "W" ? "bg-red-500 text-white" :
                        b === "" ? "bg-white/5 text-slate-600" :
                        "bg-white/10 text-slate-300"
                      }`}>{b || (i + 1)}</div>
                    ))}
                  </div>
                </div>
                {/* Decorative glow */}
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-3/4 h-12 bg-slate-900/20 blur-2xl rounded-full" />
              </div>
            </motion.div>

            {/* Row 2: Team Management — visual left, text right */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center"
            >
              {/* Mock team card visual */}
              <div className="relative order-2 lg:order-1">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-6">
                  <div className="flex items-center gap-4 mb-5">
                    <div className="h-14 w-14 rounded-xl bg-slate-900 flex items-center justify-center">
                      <span className="text-xl font-bold text-white">R</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900">Royal XI</h4>
                      <p className="text-xs text-slate-400">Cricket &middot; 11 Players</p>
                    </div>
                  </div>
                  <div className="space-y-2.5">
                    {[
                      { name: "Arjun Patel", role: "Captain &middot; Batsman", num: "7" },
                      { name: "Ravi Kumar", role: "All-rounder", num: "23" },
                      { name: "Nikhil Sharma", role: "Bowler", num: "11" },
                      { name: "Karan Singh", role: "Wicket Keeper", num: "1" },
                    ].map((p, i) => (
                      <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50">
                        <div className="h-8 w-8 rounded-lg bg-slate-900 flex items-center justify-center text-xs font-bold text-white shrink-0">
                          {p.num}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">{p.name}</p>
                          <p className="text-[11px] text-slate-400" dangerouslySetInnerHTML={{ __html: p.role }} />
                        </div>
                      </div>
                    ))}
                    <div className="flex items-center justify-center py-1 text-xs text-slate-400">
                      + 7 more players
                    </div>
                  </div>
                </div>
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-3/4 h-12 bg-slate-300/30 blur-2xl rounded-full" />
              </div>

              <div className="order-1 lg:order-2">
                <div className="inline-flex items-center gap-2 bg-slate-100 text-slate-700 rounded-full px-3 py-1 text-xs font-semibold mb-4">
                  <Users className="h-3.5 w-3.5" />
                  Team Management
                </div>
                <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4 leading-tight">
                  Build your squad.<br />Manage with ease.
                </h2>
                <p className="text-slate-500 leading-relaxed">
                  Create teams for any sport, add players with numbers and positions,
                  track rosters, and manage your entire organisation from one dashboard.
                  Edit line-ups on the fly, right before a match starts.
                </p>
              </div>
            </motion.div>

            {/* Row 3: Analytics — text left, visual right */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.6 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center"
            >
              <div>
                <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 rounded-full px-3 py-1 text-xs font-semibold mb-4">
                  <BarChart3 className="h-3.5 w-3.5" />
                  Performance Analytics
                </div>
                <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4 leading-tight">
                  Numbers that<br />tell the story.
                </h2>
                <p className="text-slate-500 leading-relaxed">
                  Win rates, per-sport performance ratings, head-to-head records,
                  and match history — all calculated automatically. See exactly where
                  your team excels and where to improve.
                </p>
              </div>

              {/* Mock analytics visual */}
              <div className="relative">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-6">
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    {[
                      { label: "Win Rate", value: "72%", sub: "18 of 25" },
                      { label: "Rating", value: "8.4", sub: "Top 10%" },
                      { label: "Sports", value: "4", sub: "Active" },
                    ].map((s, i) => (
                      <div key={i} className="text-center p-3 rounded-xl bg-slate-50">
                        <p className="text-xl font-bold text-slate-900">{s.value}</p>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">{s.label}</p>
                        <p className="text-[10px] text-emerald-600 font-medium mt-0.5">{s.sub}</p>
                      </div>
                    ))}
                  </div>
                  {/* Mini bar chart */}
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-3 font-semibold">Recent Form</p>
                  <div className="flex items-end gap-1.5 h-16">
                    {[60, 85, 45, 90, 70, 95, 55, 80, 100, 75, 65, 88].map((h, i) => (
                      <div key={i} className="flex-1 rounded-t" style={{ height: `${h}%`, backgroundColor: h >= 70 ? '#10b981' : '#e2e8f0' }} />
                    ))}
                  </div>
                  <div className="flex justify-between mt-2">
                    <span className="text-[9px] text-slate-400">Jan</span>
                    <span className="text-[9px] text-slate-400">Dec</span>
                  </div>
                </div>
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-3/4 h-12 bg-slate-300/30 blur-2xl rounded-full" />
              </div>
            </motion.div>

          </div>
        </section>

        {/* ── Features ── */}
        <section className="py-16 lg:py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-14">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 mb-3">Features</p>
              <h2 className="text-3xl lg:text-4xl font-bold text-slate-900">Everything you need to run your games</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-5xl mx-auto">
              {[
                { icon: Flame, title: "Live Scoring", desc: "Score matches ball-by-ball, point-by-point with real-time streaming to spectators." },
                { icon: Users, title: "Team Management", desc: "Create squads, manage rosters, assign positions, and track player stats." },
                { icon: Calendar, title: "Match & Tournaments", desc: "Schedule matches, build brackets, and run round-robin or knockout tournaments." },
                { icon: BarChart3, title: "Analytics", desc: "Win rates, performance ratings, sport-by-sport breakdowns and leaderboards." },
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}
                  whileHover={{ y: -6, transition: { duration: 0.2 } }}
                  className="group"
                >
                  <div className="h-full bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-xl transition-all duration-300">
                    <div className="h-11 w-11 rounded-xl bg-slate-900 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                      <feature.icon className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="text-base font-semibold text-slate-900 mb-2">{feature.title}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">{feature.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── How It Works ── */}
        <section className="py-16 lg:py-20 bg-white border-y border-slate-100">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="text-center mb-14">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 mb-3">How it works</p>
              <h2 className="text-3xl lg:text-4xl font-bold text-slate-900">Three steps to your first match</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { step: "01", title: "Create a team", desc: "Add your squad with player names, numbers, and positions." },
                { step: "02", title: "Schedule a match", desc: "Pick a sport, choose two teams, set a date and venue." },
                { step: "03", title: "Score live", desc: "Start scoring in real time — spectators see updates instantly." },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.15, duration: 0.5 }}
                  className="text-center"
                >
                  <div className="text-5xl font-black text-emerald-200 mb-4">{item.step}</div>
                  <h3 className="text-base font-semibold text-slate-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Trust / Social Proof Row ── */}
        <section className="py-14 lg:py-18">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {[
                { icon: Zap, title: "Real-time SSE Streaming", desc: "Scores push to every connected device the moment they change — no refresh needed." },
                { icon: Shield, title: "Role-based Access", desc: "Admin-only scoring controls. Viewers get a read-only experience, always in sync." },
                { icon: TrendingUp, title: "Performance Tracking", desc: "Win rates, per-sport ratings, and match history so players can see how they grow." },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.12 }}
                  className="flex gap-4 p-5 rounded-2xl bg-white border border-slate-100 shadow-sm"
                >
                  <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                    <item.icon className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 mb-1">{item.title}</h3>
                    <p className="text-[13px] text-slate-500 leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Live Matches (if any) ── */}
        {!matchesLoading && (liveMatches.length > 0 || upcomingMatches.length > 0) && (
          <LiveTodaySection matches={[...liveMatches, ...upcomingMatches]} />
        )}
        {!matchesLoading && completedMatches.length > 0 && (
          <ResultsSection matches={completedMatches} />
        )}

        {/* ── Final CTA ── */}
        <section className="py-20 lg:py-28">
          <div className="container mx-auto px-4 text-center max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">Start scoring today</h2>
              <p className="text-slate-500 mb-8 leading-relaxed">
                Free to use. No credit card needed. Create a team, schedule a match, and
                go live in under a minute.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link href="/signup">
                  <Button className="h-12 px-8 text-[15px] font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-full shadow-xl shadow-slate-900/10 transition-all duration-300 hover:-translate-y-0.5">
                    Create Free Account
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="ghost" className="h-12 px-6 text-[15px] font-semibold text-slate-600 rounded-full hover:bg-slate-100">
                    Sign in
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        <EnhancedFooter />
      </div>
    )
  }

  // ─── AUTHENTICATED DASHBOARD ─────────────────────────────────────
  const firstName = user?.full_name?.split(" ")[0] || user?.username || "there"

  const dashboardTiles = [
    {
      title: "Performance Hub",
      description: "Real-time analytics and player trends across every sport you manage.",
      href: "/analytics",
      icon: BarChart3,
      cta: "Open analytics",
    },
    {
      title: "Team Rooms",
      description: "Organise rosters, review player form, and keep squads game-ready.",
      href: "/teams",
      icon: Users,
      cta: "Manage teams",
    },
    {
      title: "Match Centre",
      description: "Track live scores, confirm schedules, and jump into scoring.",
      href: "/matches",
      icon: Calendar,
      cta: "Go to matches",
    },
    {
      title: "Tournaments",
      description: "Brackets, fixtures, and champions — all in one place.",
      href: "/tournaments",
      icon: Trophy,
      cta: "Explore tournaments",
    },
  ]

  return (
    <div className="min-h-screen bg-[#fafbfc] relative">
      {/* Subtle grid background */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: `linear-gradient(rgba(15,23,42,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.02) 1px, transparent 1px)`,
        backgroundSize: '64px 64px'
      }} />

      <div className="container mx-auto px-4 py-8 lg:py-12 relative">
        {/* Welcome */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 lg:mb-10"
        >
          <span className="text-[11px] font-semibold uppercase tracking-[0.35em] text-slate-400">
            Dashboard
          </span>
          <h1 className="mt-2 text-3xl font-bold leading-tight text-slate-900 sm:text-4xl">
            Welcome back, {firstName}.
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-500">
            Pick up where you left off or explore what&apos;s new today.
          </p>
        </motion.div>

        {/* Quick Stats */}
        {!matchesLoading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.4 }}
            className="mb-8"
          >
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
              <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-slate-100">
                {[
                  { label: "Live", value: liveMatches.length, color: "text-red-500" },
                  { label: "Scheduled", value: upcomingMatches.length, color: "text-blue-500" },
                  { label: "Completed", value: completedMatches.length, color: "text-emerald-600" },
                  { label: "Sports", value: "6", color: "text-slate-900" },
                ].map((stat, i) => (
                  <div key={i} className="px-5 py-5">
                    <div className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold mb-1">{stat.label}</div>
                    <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Live Widget */}
        {liveMatches.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.4 }}
            className="mb-8"
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
              </span>
              <h2 className="text-xs font-semibold text-slate-900 uppercase tracking-widest">Live Now</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {liveMatches.map((match) => (
                <Link key={match.id} href={`/matches/${match.id}`}>
                  <div className="bg-white rounded-2xl border border-red-200 p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group cursor-pointer">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest capitalize">{match.sport.replace("-", " ")}</span>
                      <span className="flex items-center gap-1.5 text-[10px] font-bold text-red-500 uppercase tracking-widest">
                        <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                        Live
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                          <span className="text-[9px] font-bold text-slate-600">{match.homeTeam.name.split(" ").map((w: string) => w[0]).join("").slice(0,2).toUpperCase()}</span>
                        </div>
                        <span className="text-sm font-semibold text-slate-900 truncate">{match.homeTeam.name}</span>
                      </div>
                      <div className="pl-10">
                        <span className="text-[9px] text-slate-300 font-medium uppercase tracking-wider">vs</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                          <span className="text-[9px] font-bold text-slate-600">{match.awayTeam.name.split(" ").map((w: string) => w[0]).join("").slice(0,2).toUpperCase()}</span>
                        </div>
                        <span className="text-sm font-semibold text-slate-900 truncate">{match.awayTeam.name}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}

        {/* Dashboard Tiles */}
        <div className="mb-12 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {dashboardTiles.map((tile, index) => {
            const Icon = tile.icon
            return (
              <motion.div
                key={tile.href}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.1 * index }}
                whileHover={{ y: -5 }}
              >
                <Link
                  href={tile.href}
                  className="group block h-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-xl hover:border-emerald-200"
                >
                  <div className="flex h-full flex-col justify-between">
                    <div>
                      <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition-all duration-300 group-hover:scale-110 group-hover:bg-emerald-100">
                        <Icon className="h-5 w-5" />
                      </span>
                      <h3 className="mt-5 text-base font-semibold text-slate-900">{tile.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-slate-500">{tile.description}</p>
                    </div>
                    <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600 group-hover:text-emerald-700 transition-colors duration-300">
                      {tile.cta}
                      <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
