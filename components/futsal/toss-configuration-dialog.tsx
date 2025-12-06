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
  onComplete: (config: {
    tossWinnerTeamId: string
    tossDecision: "kick_off" | "side"
    selectedSide?: string
    kickingOffTeam: string
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
  const [tossDecision, setTossDecision] = useState<"kick_off" | "side" | "">("")
  const [sideChoice, setSideChoice] = useState<"home" | "away" | "">("")
  const [oppositeTeamSideChoice, setOppositeTeamSideChoice] = useState<"home" | "away" | "">("")
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

    // Validate side selection if toss decision was side
    if (tossDecision === "side" && !sideChoice) {
      toast({
        title: "Incomplete Information",
        description: "Please select which side to take",
        variant: "destructive",
      })
      return
    }

    // Validate opposite team's side selection if toss decision was kick_off
    if (tossDecision === "kick_off" && !oppositeTeamSideChoice) {
      toast({
        title: "Incomplete Information",
        description: "Please select which side the opposite team wants",
        variant: "destructive",
      })
      return
    }

    setSaving(true)

    try {
      let kickingOffTeam: "home" | "away"
      let selectedSide: "home" | "away" | undefined

      if (tossDecision === "side") {
        // Toss winner chose side, opposite team kicks off
        selectedSide = sideChoice as "home" | "away"
        kickingOffTeam = sideChoice === "home" ? "away" : "home"
      } else {
        // Toss winner chose to kick off first, opposite team chooses side
        kickingOffTeam = tossWinner === homeTeam.id ? "home" : "away"
        selectedSide = oppositeTeamSideChoice as "home" | "away"
      }

      // Save toss configuration
      const response = await fetch(`/api/matches/${matchId}/futsal/config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tossWinnerTeamId: tossWinner,
          tossDecision,
          selectedSide,
          kickingOffTeam,
          configCompleted: true,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save toss configuration")
      }

      const tossWinnerName = tossWinner === homeTeam.id ? homeTeam.name : awayTeam.name
      const kickingOffTeamName = kickingOffTeam === "home" ? homeTeam.name : awayTeam.name

      toast({
        title: "Toss Recorded!",
        description: `${tossWinnerName} won the toss and chose to ${
          tossDecision === "side" ? `take ${sideChoice} side` : "kick off first"
        }. ${kickingOffTeamName} will kick off first.`,
      })

      onComplete({
        tossWinnerTeamId: tossWinner,
        tossDecision,
        selectedSide,
        kickingOffTeam,
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
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-2xl flex items-center gap-2">
            ⚽ Futsal Toss Configuration
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4 overflow-y-auto flex-1">
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
                setTossDecision(val as "kick_off" | "side")
                // Reset side choices when changing decision
                setSideChoice("")
                setOppositeTeamSideChoice("")
              }}>
                <SelectTrigger id="toss-decision" className="h-12">
                  <SelectValue placeholder="Select decision" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="side">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">📍</span>
                      <span className="font-medium">Choose Side</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="kick_off">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">⚽</span>
                      <span className="font-medium">Kick Off First</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Side Selection (if toss winner chose side) */}
          {tossWinner && tossDecision === "side" && (
            <div className="space-y-2">
              <Label htmlFor="side-choice" className="text-base font-semibold">
                Which side does {tossWinnerName} want?
              </Label>
              <Select value={sideChoice} onValueChange={(val) => setSideChoice(val as "home" | "away")}>
                <SelectTrigger id="side-choice" className="h-12">
                  <SelectValue placeholder="Select side" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="home">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">⬅️</span>
                      <span className="font-medium">Home Side (Left)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="away">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">➡️</span>
                      <span className="font-medium">Away Side (Right)</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Note: The opposite team will kick off first
              </p>
            </div>
          )}

          {/* Opposite Team Side Selection (if toss winner chose kick off) */}
          {tossWinner && tossDecision === "kick_off" && (
            <div className="space-y-2">
              <Label htmlFor="opposite-side" className="text-base font-semibold">
                Which side does {tossWinner === homeTeam.id ? awayTeam.name : homeTeam.name} want?
              </Label>
              <Select value={oppositeTeamSideChoice} onValueChange={(val) => setOppositeTeamSideChoice(val as "home" | "away")}>
                <SelectTrigger id="opposite-side" className="h-12">
                  <SelectValue placeholder="Select side" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="home">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">⬅️</span>
                      <span className="font-medium">Home Side (Left)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="away">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">➡️</span>
                      <span className="font-medium">Away Side (Right)</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Note: {tossWinnerName} will kick off first
              </p>
            </div>
          )}

          {/* Summary */}
          {tossWinner && tossDecision && (tossDecision === "kick_off" ? oppositeTeamSideChoice : sideChoice) && (
            <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
              <h4 className="font-semibold text-green-900 mb-2">Configuration Summary:</h4>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• Toss Winner: <span className="font-bold">{tossWinnerName}</span></li>
                <li>
                  • {tossWinnerName} chose:{" "}
                  <span className="font-bold">
                    {tossDecision === "side"
                      ? `${sideChoice === "home" ? "Home" : "Away"} Side`
                      : "Kick Off First"}
                  </span>
                </li>
                <li>
                  • First Kick Off:{" "}
                  <span className="font-bold">
                    {tossDecision === "side"
                      ? sideChoice === "home"
                        ? awayTeam.name
                        : homeTeam.name
                      : tossWinnerName}
                  </span>
                </li>
                <li>
                  • Side Assignment:{" "}
                  <span className="font-bold">
                    {tossDecision === "side"
                      ? `${sideChoice === "home" ? "Home" : "Away"} (${tossWinnerName})`
                      : `${oppositeTeamSideChoice === "home" ? "Home" : "Away"} (${tossWinner === homeTeam.id ? awayTeam.name : homeTeam.name})`}
                  </span>
                </li>
              </ul>
            </div>
          )}
        </div>

        <div className="flex gap-3 flex-shrink-0 pt-4 border-t">
          <Button variant="outline" onClick={onCancel} disabled={saving} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !tossWinner || !tossDecision || (tossDecision === "side" && !sideChoice) || (tossDecision === "kick_off" && !oppositeTeamSideChoice)}
            className="flex-1"
          >
            {saving ? "Saving..." : "Confirm Toss"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

