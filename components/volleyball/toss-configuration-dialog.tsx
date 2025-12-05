"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import type { Team } from "@/lib/static-data"

interface TossConfigurationDialogProps {
  open: boolean
  matchId: string
  homeTeam: Team
  awayTeam: Team
  numberOfSets: 3 | 5
  onComplete: (config: {
    tossWinnerTeamId: string
    tossDecision: "court_side" | "serve"
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
  numberOfSets,
  onComplete,
  onCancel,
}: TossConfigurationDialogProps) {
  const [tossWinner, setTossWinner] = useState<string>("")
  const [tossDecision, setTossDecision] = useState<"court_side" | "serve" | "">("")
  const [courtSideChoice, setCourtSideChoice] = useState<"home" | "away" | "">("")
  const [oppositeTeamCourtSideChoice, setOppositeTeamCourtSideChoice] = useState<"home" | "away" | "">("")
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

      // Save toss configuration
      const response = await fetch(`/api/matches/${matchId}/volleyball/config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          numberOfSets,
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
            🏐 Volleyball Toss Configuration
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Match Format Info */}
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <p className="text-sm font-medium text-blue-900">
              Match Format: <span className="font-bold">Best of {numberOfSets}</span>
            </p>
            <p className="text-xs text-blue-700 mt-1">
              First to {numberOfSets === 5 ? "3" : "2"} sets wins the match
            </p>
          </div>

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
                setTossDecision(val as "court_side" | "serve")
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
                      <span className="text-lg">🏐</span>
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
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onCancel} disabled={saving} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !tossWinner || !tossDecision || (tossDecision === "court_side" && !courtSideChoice) || (tossDecision === "serve" && !oppositeTeamCourtSideChoice)}
            className="flex-1"
          >
            {saving ? "Saving..." : "Confirm Toss"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

