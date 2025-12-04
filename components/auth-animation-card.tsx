"use client"

import { motion } from "framer-motion"
import Lottie from "lottie-react"
import ballSportAnimation from "@/public/Ball Sport.json"

export function AuthAnimationCard() {
  return (
    <div className="relative h-full w-full flex items-center justify-center overflow-hidden">
      {/* Subtle white background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 via-white to-slate-50/50 rounded-2xl" />
      
      {/* Ball Sport Animation */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 w-full h-full flex items-center justify-center p-4"
      >
        <div className="relative w-full h-full max-w-lg max-h-[600px] flex items-center justify-center">
          <Lottie
            animationData={ballSportAnimation}
            loop={true}
            className="w-full h-full"
            style={{ maxWidth: "100%", maxHeight: "100%" }}
          />
        </div>
      </motion.div>

      {/* Subtle decorative circles */}
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.15, 0.25, 0.15],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-10 right-10 w-20 h-20 bg-slate-200/30 rounded-full blur-2xl"
      />
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.15, 0.25, 0.15],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
        className="absolute bottom-10 left-10 w-24 h-24 bg-slate-200/30 rounded-full blur-2xl"
      />
    </div>
  )
}

