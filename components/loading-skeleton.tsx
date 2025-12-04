import { motion } from "framer-motion"

interface SkeletonProps {
  className?: string
  variant?: "card" | "text" | "avatar" | "button" | "match-card"
}

export function Skeleton({ className = "", variant = "text" }: SkeletonProps) {
  const baseClasses = "skeleton"
  
  const variantClasses = {
    text: "h-4 w-full",
    card: "h-32 w-full rounded-lg",
    avatar: "h-12 w-12 rounded-full",
    button: "h-10 w-24 rounded-md",
    "match-card": "h-48 w-full rounded-xl",
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
    />
  )
}

export function MatchCardSkeleton() {
  return (
    <div className="glass p-6 rounded-xl space-y-4 angular-card">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton variant="avatar" className="h-10 w-10" />
            <Skeleton className="h-5 w-32" />
          </div>
          <Skeleton className="h-8 w-16 font-bold" />
        </div>
        
        <div className="flex items-center justify-center">
          <Skeleton className="h-4 w-8" />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton variant="avatar" className="h-10 w-10" />
            <Skeleton className="h-5 w-32" />
          </div>
          <Skeleton className="h-8 w-16 font-bold" />
        </div>
      </div>
      
      <div className="flex items-center justify-between pt-3 border-t border-border/50">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-28" />
      </div>
    </div>
  )
}

export function HeroSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-16 w-3/4 mx-auto" />
      <Skeleton className="h-6 w-2/3 mx-auto" />
      <div className="flex gap-4 justify-center">
        <Skeleton variant="button" className="w-32 h-12" />
        <Skeleton variant="button" className="w-32 h-12" />
      </div>
    </div>
  )
}

export function FeatureCardSkeleton() {
  return (
    <div className="glass p-6 rounded-xl space-y-4 h-full">
      <Skeleton variant="avatar" className="h-16 w-16 rounded-2xl mx-auto" />
      <Skeleton className="h-6 w-32 mx-auto" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6 mx-auto" />
    </div>
  )
}

export function TournamentCardSkeleton() {
  return (
    <div className="border rounded-lg p-6 space-y-4 h-full">
      <div className="flex justify-between items-start">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-12 w-12 rounded-full" />
      </div>
      <Skeleton className="h-7 w-3/4" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-40" />
      </div>
    </div>
  )
}