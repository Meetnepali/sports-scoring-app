"use client"

import { Match } from "@/lib/static-data"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { Clock, MapPin } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

interface LiveTodaySectionProps {
  matches: Match[]
}

export function LiveTodaySection({ matches }: LiveTodaySectionProps) {
  if (!matches || matches.length === 0) return null

  const featuredMatch = matches[0]

  return (
    <section className="py-12 lg:py-16">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-4xl lg:text-5xl font-bold mb-2">Live today</h2>
            <p className="text-muted-foreground text-lg">({matches.length} Matches)</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-[400px_1fr] gap-6 lg:gap-8">
          {/* Left Sidebar - Match List */}
          <div className="space-y-4">
            {matches.map((match, index) => (
              <motion.div
                key={match.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Link href={`/matches/${match.id}`}>
                  <Card className={`p-5 hover:shadow-lg transition-all duration-300 cursor-pointer border-l-4 ${
                    index === 0 ? 'border-l-primary bg-primary/5' : 'border-l-transparent'
                  }`}>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-lg">{match.homeTeam.name} vs {match.awayTeam.name}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground capitalize">{match.sport}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{new Date(match.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Right Side - Featured Match Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="relative"
          >
            <Card className="overflow-hidden h-full min-h-[400px] lg:min-h-[500px]">
              <div className="relative w-full h-full">
                {/* Stadium Image Placeholder - Replace with actual image */}
                <div className="absolute inset-0 bg-gradient-to-br from-green-900 via-green-800 to-green-900">
                  <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-30" />
                </div>
                
                {/* Loading Circle */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative">
                    <div className="w-32 h-32 rounded-full border-4 border-white/20 flex items-center justify-center">
                      <svg className="animate-spin h-20 w-20" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-white text-xl font-bold">56%</span>
                      </div>
                    </div>
                    <p className="text-white text-center mt-4 text-sm">Waiting for responses...</p>
                  </div>
                </div>

                {/* Match Info Overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                  <h3 className="text-white text-2xl font-bold mb-2">
                    {featuredMatch.homeTeam.name} vs {featuredMatch.awayTeam.name}
                  </h3>
                  <div className="flex items-center gap-4 text-white/80">
                    <span className="capitalize">{featuredMatch.sport}</span>
                    <span>•</span>
                    <span>{new Date(featuredMatch.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
