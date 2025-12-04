"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Users } from "lucide-react"
import type { Team } from "@/lib/static-data"

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
  const [firstGameType, setFirstGameType] = useState<"singles" | "doubles" | "">("")
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

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

    // Validate first game type
    if (!firstGameType) {
      toast({
        title: "Incomplete Information",
        description: "Please select the type for the first game",
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
        // Toss winner chose to serve first
        servingTeam = tossWinner === homeTeam.id ? "home" : "away"
        // Opposite team gets court side choice (we'll default to their original side)
        selectedCourtSide = servingTeam === "home" ? "away" : "home"
      }

      // Save toss configuration
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

      // Update match score to set first game type
      if (response.ok) {
        const matchResponse = await fetch(`/api/matches/${matchId}`)
        const matchData = await matchResponse.json()
        if (matchData.match) {
          let score = matchData.match.score || {}
          if (typeof score === 'string') {
            score = JSON.parse(score)
          }
          if (!score.games || !Array.isArray(score.games)) {
            const gamesToWin = 2 // default, should come from config
            score.games = Array.from({ length: gamesToWin === 2 ? 3 : 5 }, () => ({ home: 0, away: 0, type: "singles" }))
          }
          if (score.games[0]) {
            score.games[0].type = firstGameType
          }
          
          await fetch(`/api/matches/${matchId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ score }),
          })
        }
      }

      if (!response.ok) {
        throw new Error("Failed to save toss configuration")
      }

      const tossWinnerName = tossWinner === homeTeam.id ? homeTeam.name : awayTeam.name
      const servingTeamName = servingTeam === "home" ? homeTeam.name : awayTeam.name

      toast({
        title: "Toss Recorded!",
        description: `${tossWinnerName} won the toss and chose to ${
          tossDecision === "court_side" ? `take ${courtSideChoice} court side` : "serve first"
        }. ${servingTeamName} will serve first.`,
      })

      onComplete({
        tossWinnerTeamId: tossWinner,
        tossDecision,
        selectedCourtSide,
        servingTeam,
      })
    } catch (error) {
      console.error("Error saving toss:", error)
      toast({
        title: "Error",
        description: "Failed to save toss configuration. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const tossWinnerName = tossWinner === homeTeam.id ? homeTeam.name : awayTeam.name

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel?.()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            🏸 Badminton Toss Configuration
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
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
              <Select value={tossDecision} onValueChange={(val) => setTossDecision(val as "serve" | "court_side")}>
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

          {/* Court Side Selection (if applicable) */}
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

          {/* First Game Type Selection */}
          {tossWinner && tossDecision && (tossDecision === "serve" || courtSideChoice) && (
            <div className="space-y-2">
              <Label htmlFor="first-game-type" className="text-base font-semibold">
                What type will be played for Game 1?
              </Label>
              <Select value={firstGameType} onValueChange={(val) => setFirstGameType(val as "singles" | "doubles")}>
                <SelectTrigger id="first-game-type" className="h-12">
                  <SelectValue placeholder="Select game type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="singles">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span className="font-medium">Singles</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="doubles">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span className="font-medium">Doubles</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Summary */}
          {tossWinner && tossDecision && (tossDecision === "serve" || courtSideChoice) && firstGameType && (
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
                  • Game 1 Type: <span className="font-bold capitalize">{firstGameType}</span>
                </li>
              </ul>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onCancel} disabled={saving} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !tossWinner || !tossDecision || (tossDecision === "court_side" && !courtSideChoice) || !firstGameType}
            className="flex-1"
          >
            {saving ? "Saving..." : "Confirm Toss"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

