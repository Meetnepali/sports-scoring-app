"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import type { Team } from "@/lib/static-data"

interface MatchAssignment {
  matchNumber: number
  type: "singles" | "doubles"
}

interface TossConfigurationDialogProps {
  open: boolean
  matchId: string
  homeTeam: Team
  awayTeam: Team
  onComplete: (config: {
    tossWinnerTeamId: string
    tossDecision: "serve" | "court_side"
    selectedCourtSide?: string
    servingTeam: string
  }) => void
  onCancel?: () => void
}

export function TossConfigurationDialog({
  open,
  matchId,
  homeTeam,
  awayTeam,
  onComplete,
  onCancel,
}: TossConfigurationDialogProps) {
  const [tossWinner, setTossWinner] = useState<string>("")
  const [tossDecision, setTossDecision] = useState<"serve" | "court_side" | "">("")
  const [courtSideChoice, setCourtSideChoice] = useState<"home" | "away" | "">("")
  const [oppositeTeamCourtSideChoice, setOppositeTeamCourtSideChoice] = useState<"home" | "away" | "">("")
  const [matches, setMatches] = useState<MatchAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  // Fetch config and initialize matches based on numberOfMatches and matchTypes
  useEffect(() => {
    async function fetchConfig() {
      if (!open || !matchId) return
      
      try {
        setLoading(true)
        const response = await fetch(`/api/matches/${matchId}/badminton/config`)
        const data = await response.json()
        
        if (data.config && data.config.numberOfMatches) {
          const numMatches = data.config.numberOfMatches
          const types = data.config.matchTypes || Array(numMatches).fill("singles")
          
          // Initialize matches array with configured types (read-only display)
          const initialMatches: MatchAssignment[] = []
          for (let i = 0; i < numMatches; i++) {
            initialMatches.push({
              matchNumber: i + 1,
              type: types[i] || "singles"
            })
          }
          setMatches(initialMatches)
        } else {
          // Fallback to 3 matches if config not found
          const defaultMatches = [
            { matchNumber: 1, type: "singles" as const },
            { matchNumber: 2, type: "singles" as const },
            { matchNumber: 3, type: "singles" as const },
          ]
          setMatches(defaultMatches)
        }
      } catch (error) {
        console.error("Error fetching config:", error)
        // Fallback to 3 matches
        const defaultMatches = [
          { matchNumber: 1, type: "singles" as const },
          { matchNumber: 2, type: "singles" as const },
          { matchNumber: 3, type: "singles" as const },
        ]
        setMatches(defaultMatches)
      } finally {
        setLoading(false)
      }
    }
    
    fetchConfig()
  }, [open, matchId])

  const handleSave = async () => {
    if (!tossWinner || !tossDecision) {
      toast({
        title: "Incomplete Information",
        description: "Please complete all toss configuration steps",
        variant: "destructive",
      })
      return
    }

    // Validate court side selection if toss decision was court_side
    if (tossDecision === "court_side" && !courtSideChoice) {
      toast({
        title: "Incomplete Information",
        description: "Please select which court side to take",
        variant: "destructive",
      })
      return
    }

    // Validate opposite team's court side selection if toss decision was serve
    if (tossDecision === "serve" && !oppositeTeamCourtSideChoice) {
      toast({
        title: "Incomplete Information",
        description: "Please select which court side the opposite team wants",
        variant: "destructive",
      })
      return
    }

    setSaving(true)

    try {
      let servingTeam: "home" | "away"
      let selectedCourtSide: "home" | "away" | undefined

      if (tossDecision === "court_side") {
        // Toss winner chose court side, opposite team serves
        selectedCourtSide = courtSideChoice as "home" | "away"
        servingTeam = courtSideChoice === "home" ? "away" : "home"
      } else {
        // Toss winner chose to serve first, opposite team chooses court side
        servingTeam = tossWinner === homeTeam.id ? "home" : "away"
        selectedCourtSide = oppositeTeamCourtSideChoice as "home" | "away"
      }

      // Save toss configuration (no player assignments needed)
      const response = await fetch(`/api/matches/${matchId}/badminton/config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tossWinnerTeamId: tossWinner,
          tossDecision,
          selectedCourtSide,
          servingTeam,
          configCompleted: true,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save toss configuration")
      }

      toast({
        title: "Configuration Complete!",
        description: `Match setup completed. Ready to begin.`,
      })

      onComplete({
        tossWinnerTeamId: tossWinner,
        tossDecision,
        selectedCourtSide,
        servingTeam,
      })
    } catch (error) {
      console.error("Error saving configuration:", error)
      toast({
        title: "Error",
        description: "Failed to save configuration. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const tossWinnerName = tossWinner === homeTeam.id ? homeTeam.name : awayTeam.name

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel?.()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-2xl flex items-center gap-2">
            🏸 Badminton Match Configuration
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4 overflow-y-auto flex-1">
          {loading ? (
            <div className="text-center py-8">Loading match configuration...</div>
          ) : (
            <>
          {/* Toss Winner Selection */}
          <div className="space-y-2">
            <Label htmlFor="toss-winner" className="text-base font-semibold">
              Who won the toss?
            </Label>
            <Select value={tossWinner} onValueChange={setTossWinner}>
              <SelectTrigger id="toss-winner" className="h-12">
                <SelectValue placeholder="Select toss winner" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={homeTeam.id}>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🏠</span>
                    <span className="font-medium">{homeTeam.name} (Home)</span>
                  </div>
                </SelectItem>
                <SelectItem value={awayTeam.id}>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">✈️</span>
                    <span className="font-medium">{awayTeam.name} (Away)</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Toss Decision */}
          {tossWinner && (
            <div className="space-y-2">
              <Label htmlFor="toss-decision" className="text-base font-semibold">
                What did {tossWinnerName} choose?
              </Label>
              <Select value={tossDecision} onValueChange={(val) => {
                setTossDecision(val as "serve" | "court_side")
                // Reset side choices when changing decision
                setCourtSideChoice("")
                setOppositeTeamCourtSideChoice("")
              }}>
                <SelectTrigger id="toss-decision" className="h-12">
                  <SelectValue placeholder="Select decision" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="court_side">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">📍</span>
                      <span className="font-medium">Choose Court Side</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="serve">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🏸</span>
                      <span className="font-medium">Serve First</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Court Side Selection (if toss winner chose court side) */}
          {tossWinner && tossDecision === "court_side" && (
            <div className="space-y-2">
              <Label htmlFor="court-side" className="text-base font-semibold">
                Which court side does {tossWinnerName} want?
              </Label>
              <Select value={courtSideChoice} onValueChange={(val) => setCourtSideChoice(val as "home" | "away")}>
                <SelectTrigger id="court-side" className="h-12">
                  <SelectValue placeholder="Select court side" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="home">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">⬅️</span>
                      <span className="font-medium">Home Court Side (Left)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="away">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">➡️</span>
                      <span className="font-medium">Away Court Side (Right)</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Note: The opposite team will serve first
              </p>
            </div>
          )}

          {/* Opposite Team Court Side Selection (if toss winner chose serve) */}
          {tossWinner && tossDecision === "serve" && (
            <div className="space-y-2">
              <Label htmlFor="opposite-court-side" className="text-base font-semibold">
                Which court side does {tossWinner === homeTeam.id ? awayTeam.name : homeTeam.name} want?
              </Label>
              <Select value={oppositeTeamCourtSideChoice} onValueChange={(val) => setOppositeTeamCourtSideChoice(val as "home" | "away")}>
                <SelectTrigger id="opposite-court-side" className="h-12">
                  <SelectValue placeholder="Select court side" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="home">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">⬅️</span>
                      <span className="font-medium">Home Court Side (Left)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="away">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">➡️</span>
                      <span className="font-medium">Away Court Side (Right)</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Note: {tossWinnerName} will serve first
              </p>
            </div>
          )}

          {/* Summary */}
          {tossWinner && tossDecision && (tossDecision === "serve" ? oppositeTeamCourtSideChoice : courtSideChoice) && (
            <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
              <h4 className="font-semibold text-green-900 mb-2">Configuration Summary:</h4>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• Toss Winner: <span className="font-bold">{tossWinnerName}</span></li>
                <li>
                  • {tossWinnerName} chose:{" "}
                  <span className="font-bold">
                    {tossDecision === "court_side"
                      ? `${courtSideChoice === "home" ? "Home" : "Away"} Court Side`
                      : "Serve First"}
                  </span>
                </li>
                <li>
                  • First Server:{" "}
                  <span className="font-bold">
                    {tossDecision === "court_side"
                      ? courtSideChoice === "home"
                        ? awayTeam.name
                        : homeTeam.name
                      : tossWinnerName}
                  </span>
                </li>
                <li>
                  • Court Side Assignment:{" "}
                  <span className="font-bold">
                    {tossDecision === "court_side"
                      ? `${courtSideChoice === "home" ? "Home" : "Away"} (${tossWinnerName})`
                      : `${oppositeTeamCourtSideChoice === "home" ? "Home" : "Away"} (${tossWinner === homeTeam.id ? awayTeam.name : homeTeam.name})`}
                  </span>
                </li>
              </ul>
            </div>
          )}

          {/* Match Types Display (Read-only) */}
          {matches.length > 0 && (
            <div className="space-y-3">
              <Label className="text-base font-semibold">Match Configuration</Label>
              <p className="text-sm text-muted-foreground">
                Match types are configured during fixture creation. All sets within each match will use the same type.
              </p>
              {matches.map((match) => (
                <div key={match.matchNumber} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                  <span className="font-medium">Match {match.matchNumber}</span>
                  <Badge variant="outline" className="px-3 py-1">
                    {match.type === "singles" ? "Singles" : "Doubles"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
            </>
          )}
        </div>

        <div className="flex gap-3 flex-shrink-0 pt-4 border-t">
          <Button variant="outline" onClick={onCancel} disabled={saving} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !tossWinner || !tossDecision || (tossDecision === "court_side" && !courtSideChoice) || (tossDecision === "serve" && !oppositeTeamCourtSideChoice)}
            className="flex-1"
          >
            {saving ? "Saving..." : "Complete Setup"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

