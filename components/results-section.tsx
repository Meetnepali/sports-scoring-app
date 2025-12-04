"use client"

import { Match } from "@/lib/static-data"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import Link from "next/link"
import Image from "next/image"

interface ResultsSectionProps {
  matches: Match[]
}

const sportLogos: Record<string, string> = {
  cricket: "🏏",
  volleyball: "🏐",
  chess: "♟️",
  futsal: "⚽",
  tabletennis: "🏓",
  badminton: "🏸",
}

export function ResultsSection({ matches }: ResultsSectionProps) {
  if (!matches || matches.length === 0) return null

  return (
    <section className="py-12 lg:py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-4xl lg:text-5xl font-bold">Results</h2>
          <Link href="/matches/history">
            <Button variant="ghost" className="text-base">View All</Button>
          </Link>
        </div>

        <div className="space-y-4">
          {matches.map((match, index) => (
            <motion.div
              key={match.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <Card className="p-6 hover:shadow-xl transition-all duration-300 bg-background border-2">
                <div className="flex items-center justify-between gap-6">
                  {/* League Icon */}
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-3xl shadow-lg">
                      {sportLogos[match.sport] || "🏆"}
                    </div>
                  </div>

                  {/* Date & Time */}
                  <div className="flex-shrink-0 text-center min-w-[140px]">
                    <p className="font-bold text-lg">
                      {new Date(match.date).toLocaleDateString('en-US', { weekday: 'short', day: '2-digit', month: 'short' })}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(match.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })} <span className="uppercase text-xs">am</span>
                    </p>
                  </div>

                  {/* Teams & Logos */}
                  <div className="flex items-center gap-4 flex-1 justify-center">
                    {/* Home Team */}
                    <div className="flex items-center gap-3 flex-1 justify-end">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white font-bold shadow-md">
                        {match.homeTeam.name.substring(0, 2).toUpperCase()}
                      </div>
                    </div>

                    {/* VS Divider */}
                    <div className="flex items-center gap-2 px-4">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                        <span className="text-xs font-bold text-muted-foreground">VS</span>
                      </div>
                    </div>

                    {/* Away Team */}
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold shadow-md">
                        {match.awayTeam.name.substring(0, 2).toUpperCase()}
                      </div>
                    </div>
                  </div>

                  {/* Team Names */}
                  <div className="flex-1 text-center max-w-[300px]">
                    <p className="font-bold text-lg">
                      {match.homeTeam.name}
                    </p>
                    <p className="font-bold text-lg">
                      {match.awayTeam.name}
                    </p>
                  </div>

                  {/* View Highlight Button */}
                  <div className="flex-shrink-0">
                    <Link href={`/matches/${match.id}`}>
                      <Button 
                        variant="default" 
                        className="rounded-full px-6 py-5 font-semibold hover:scale-105 transition-transform"
                      >
                        View Highlight
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
