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
    tossDecision: "serve" | "table_side"
    selectedTableSide?: string
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
  const [tossDecision, setTossDecision] = useState<"serve" | "table_side" | "">("")
  const [tableSideChoice, setTableSideChoice] = useState<"home" | "away" | "">("")
  const [oppositeTeamSideChoice, setOppositeTeamSideChoice] = useState<"home" | "away" | "">("")
  const [firstSetType, setFirstSetType] = useState<"singles" | "doubles" | "">("")
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

    // Validate table side selection if toss decision was table_side
    if (tossDecision === "table_side" && !tableSideChoice) {
      toast({
        title: "Incomplete Information",
        description: "Please select which table side to take",
        variant: "destructive",
      })
      return
    }

    // Validate opposite team's side selection if toss decision was serve
    if (tossDecision === "serve" && !oppositeTeamSideChoice) {
      toast({
        title: "Incomplete Information",
        description: "Please select which table side the opposite team wants",
        variant: "destructive",
      })
      return
    }

    // Validate first set type
    if (!firstSetType) {
      toast({
        title: "Incomplete Information",
        description: "Please select the type for the first set",
        variant: "destructive",
      })
      return
    }

    setSaving(true)

    try {
      let servingTeam: "home" | "away"
      let selectedTableSide: "home" | "away" | undefined

      if (tossDecision === "table_side") {
        // Toss winner chose table side, opposite team serves
        selectedTableSide = tableSideChoice as "home" | "away"
        servingTeam = tableSideChoice === "home" ? "away" : "home"
      } else {
        // Toss winner chose to serve first, opposite team chooses table side
        servingTeam = tossWinner === homeTeam.id ? "home" : "away"
        selectedTableSide = oppositeTeamSideChoice as "home" | "away"
      }

      // Save toss configuration
      const response = await fetch(`/api/matches/${matchId}/table-tennis/config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tossWinnerTeamId: tossWinner,
          tossDecision,
          selectedTableSide,
          servingTeam,
          configCompleted: true,
        }),
      })

      // Update match score to set first set type
      if (response.ok) {
        const matchResponse = await fetch(`/api/matches/${matchId}`)
        const matchData = await matchResponse.json()
        if (matchData.match) {
          let score = matchData.match.score || {}
          if (typeof score === 'string') {
            score = JSON.parse(score)
          }
          if (!score.sets || !Array.isArray(score.sets)) {
            const setsToWin = 2 // default, should come from config
            score.sets = Array.from({ length: setsToWin === 2 ? 3 : setsToWin === 3 ? 5 : 7 }, () => ({ home: 0, away: 0, type: "singles" }))
          }
          if (score.sets[0]) {
            score.sets[0].type = firstSetType
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
          tossDecision === "table_side" ? `take ${tableSideChoice} table side` : "serve first"
        }. ${servingTeamName} will serve first.`,
      })

      onComplete({
        tossWinnerTeamId: tossWinner,
        tossDecision,
        selectedTableSide,
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
            🏓 Table Tennis Toss Configuration
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
              <Select value={tossDecision} onValueChange={(val) => {
                setTossDecision(val as "serve" | "table_side")
                // Reset side choices when changing decision
                setTableSideChoice("")
                setOppositeTeamSideChoice("")
              }}>
                <SelectTrigger id="toss-decision" className="h-12">
                  <SelectValue placeholder="Select decision" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="table_side">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">📍</span>
                      <span className="font-medium">Choose Table Side</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="serve">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🏓</span>
                      <span className="font-medium">Serve First</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Table Side Selection (if toss winner chose table side) */}
          {tossWinner && tossDecision === "table_side" && (
            <div className="space-y-2">
              <Label htmlFor="table-side" className="text-base font-semibold">
                Which table side does {tossWinnerName} want?
              </Label>
              <Select value={tableSideChoice} onValueChange={(val) => setTableSideChoice(val as "home" | "away")}>
                <SelectTrigger id="table-side" className="h-12">
                  <SelectValue placeholder="Select table side" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="home">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">⬅️</span>
                      <span className="font-medium">Home Table Side (Left)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="away">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">➡️</span>
                      <span className="font-medium">Away Table Side (Right)</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Note: The opposite team will serve first
              </p>
            </div>
          )}

          {/* Opposite Team Side Selection (if toss winner chose serve) */}
          {tossWinner && tossDecision === "serve" && (
            <div className="space-y-2">
              <Label htmlFor="opposite-side" className="text-base font-semibold">
                Which table side does {tossWinner === homeTeam.id ? awayTeam.name : homeTeam.name} want?
              </Label>
              <Select value={oppositeTeamSideChoice} onValueChange={(val) => setOppositeTeamSideChoice(val as "home" | "away")}>
                <SelectTrigger id="opposite-side" className="h-12">
                  <SelectValue placeholder="Select table side" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="home">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">⬅️</span>
                      <span className="font-medium">Home Table Side (Left)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="away">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">➡️</span>
                      <span className="font-medium">Away Table Side (Right)</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Note: {tossWinnerName} will serve first
              </p>
            </div>
          )}

          {/* First Set Type Selection */}
          {tossWinner && tossDecision && (tossDecision === "serve" ? oppositeTeamSideChoice : tableSideChoice) && (
            <div className="space-y-2">
              <Label htmlFor="first-set-type" className="text-base font-semibold">
                What type will be played for Set 1?
              </Label>
              <Select value={firstSetType} onValueChange={(val) => setFirstSetType(val as "singles" | "doubles")}>
                <SelectTrigger id="first-set-type" className="h-12">
                  <SelectValue placeholder="Select set type" />
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
          {tossWinner && tossDecision && (tossDecision === "serve" ? oppositeTeamSideChoice : tableSideChoice) && firstSetType && (
            <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
              <h4 className="font-semibold text-green-900 mb-2">Configuration Summary:</h4>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• Toss Winner: <span className="font-bold">{tossWinnerName}</span></li>
                <li>
                  • {tossWinnerName} chose:{" "}
                  <span className="font-bold">
                    {tossDecision === "table_side"
                      ? `${tableSideChoice === "home" ? "Home" : "Away"} Table Side`
                      : "Serve First"}
                  </span>
                </li>
                <li>
                  • First Server:{" "}
                  <span className="font-bold">
                    {tossDecision === "table_side"
                      ? tableSideChoice === "home"
                        ? awayTeam.name
                        : homeTeam.name
                      : tossWinnerName}
                  </span>
                </li>
                <li>
                  • Table Side Assignment:{" "}
                  <span className="font-bold">
                    {tossDecision === "table_side"
                      ? `${tableSideChoice === "home" ? "Home" : "Away"} (${tossWinnerName})`
                      : `${oppositeTeamSideChoice === "home" ? "Home" : "Away"} (${tossWinner === homeTeam.id ? awayTeam.name : homeTeam.name})`}
                  </span>
                </li>
                <li>
                  • Set 1 Type: <span className="font-bold capitalize">{firstSetType}</span>
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
            disabled={saving || !tossWinner || !tossDecision || (tossDecision === "table_side" && !tableSideChoice) || (tossDecision === "serve" && !oppositeTeamSideChoice) || !firstSetType}
            className="flex-1"
          >
            {saving ? "Saving..." : "Confirm Toss"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

