"use client"

import { ReactNode } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Lock, Eye, CheckCircle2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import type { Match } from "@/lib/static-data"

interface ScoreboardWrapperProps {
  match: Match
  children: ReactNode
}

export function ScoreboardWrapper({ match, children }: ScoreboardWrapperProps) {
  const { isAdmin } = useAuth()
  const isCompleted = match.status === "completed"

  // Show completed match banner (but don't block interactions - dialogs need to work)
  if (isCompleted) {
    return (
      <div>
        {/* Completed match banner */}
        <Alert className="mb-4 border-green-500 bg-green-50 dark:bg-green-900/20">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            <strong>Match Completed</strong> - This match has ended. Scores are final and cannot be modified.
          </AlertDescription>
        </Alert>
        
        {/* Render scoreboard normally - let individual scoreboards handle their own disabled states */}
        {children}
      </div>
    )
  }

  // Show read-only banner for non-admin users (but still render scoreboard)
  if (!isAdmin && (match.status === "live" || match.status === "started")) {
    return (
      <div>
        {/* Read-only banner */}
        <Alert className="mb-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20">
          <Eye className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800 dark:text-blue-200">
            <Badge variant="outline" className="bg-blue-100 text-blue-700 mr-2">
              <Lock className="h-3 w-3 mr-1" />
              Read-Only Mode
            </Badge>
            You can view live scores but cannot make changes. Admin access required to update scores.
          </AlertDescription>
        </Alert>
        
        {/* Render scoreboard - scoreboards handle their own read-only state based on isAdmin */}
        {children}
      </div>
    )
  }

  // Admin user with live/started match - full access
  return <>{children}</>
}

