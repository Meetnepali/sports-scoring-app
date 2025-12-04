"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useState } from "react"

const sportsData = [
  { 
    id: "cricket", 
    name: "Cricket", 
    icon: "🏏",
    color: "from-orange-500 to-red-500"
  },
  { 
    id: "volleyball", 
    name: "Volleyball", 
    icon: "🏐",
    color: "from-blue-500 to-cyan-500"
  },
  { 
    id: "chess", 
    name: "Chess", 
    icon: "♟️",
    color: "from-gray-700 to-gray-900"
  },
  { 
    id: "futsal", 
    name: "Futsal", 
    icon: "⚽",
    color: "from-green-500 to-emerald-600"
  },
  { 
    id: "tabletennis", 
    name: "Table Tennis", 
    icon: "🏓",
    color: "from-purple-500 to-violet-600"
  },
  { 
    id: "badminton", 
    name: "Badminton", 
    icon: "🏸",
    color: "from-pink-500 to-rose-500"
  },
]

export function SportsLeaguesSection() {
  const [currentPage, setCurrentPage] = useState(0)
  const itemsPerPage = 4
  const totalPages = Math.ceil(sportsData.length / itemsPerPage)
  
  const currentSports = sportsData.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  )

  return (
    <section className="py-12 lg:py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl lg:text-5xl font-bold mb-3">
            Discover your top
          </h2>
          <h2 className="text-4xl lg:text-5xl font-bold">
            Sports Leagues
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {currentSports.map((sport, index) => (
            <motion.div
              key={sport.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -8, transition: { duration: 0.2 } }}
            >
              <Link href={`/sports/${sport.id}`}>
                <Card className="p-8 h-[280px] flex flex-col items-center justify-center hover:shadow-2xl transition-all duration-300 cursor-pointer border-2 hover:border-primary/50 group relative overflow-hidden">
                  {/* Background Gradient */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${sport.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                  
                  {/* Sport Icon */}
                  <div className="relative z-10 mb-6">
                    <div className={`w-32 h-32 rounded-full bg-gradient-to-br ${sport.color} flex items-center justify-center text-6xl shadow-2xl group-hover:scale-110 transition-transform duration-300`}>
                      {sport.icon}
                    </div>
                  </div>
                  
                  {/* Sport Name */}
                  <h3 className="relative z-10 text-2xl font-bold text-center group-hover:text-primary transition-colors">
                    {sport.name}
                  </h3>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-center gap-6 mt-12">
          <button
            onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0}
            className="text-lg hover:text-primary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-6 w-6" />
            <span className="sr-only">Previous</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xl font-bold">
              {String(currentPage + 1).padStart(2, '0')}
            </span>
            <span className="text-muted-foreground">/</span>
            <span className="text-muted-foreground">
              {String(totalPages).padStart(2, '0')}
            </span>
          </div>

          <button
            onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
            disabled={currentPage === totalPages - 1}
            className="text-lg hover:text-primary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="h-6 w-6" />
            <span className="sr-only">Next</span>
          </button>
        </div>
      </div>
    </section>
  )
}
