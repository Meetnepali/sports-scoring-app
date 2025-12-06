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
    tossDecision: "color" | "side"
    selectedColor?: string
    whiteTeamId: string
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
  const [tossDecision, setTossDecision] = useState<"color" | "side" | "">("")
  const [colorChoice, setColorChoice] = useState<"white" | "black" | "">("")
  const [sideChoice, setSideChoice] = useState<"home" | "away" | "">("")
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

    // Validate color selection if toss decision was color
    if (tossDecision === "color" && !colorChoice) {
      toast({
        title: "Incomplete Information",
        description: "Please select which color to play",
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

    setSaving(true)

    try {
      let whiteTeamId: string
      let selectedColor: "white" | "black" | undefined

      if (tossDecision === "color") {
        // Toss winner chose color
        selectedColor = colorChoice as "white" | "black"
        whiteTeamId = selectedColor === "white" ? tossWinner : (tossWinner === homeTeam.id ? awayTeam.id : homeTeam.id)
      } else {
        // Toss winner chose side
        selectedColor = sideChoice === "home" ? "black" : "white"
        whiteTeamId = sideChoice === "home" ? awayTeam.id : homeTeam.id
      }

      // Save toss configuration
      const response = await fetch(`/api/matches/${matchId}/chess/config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tossWinnerTeamId: tossWinner,
          tossDecision,
          selectedColor,
          whiteTeamId,
          configCompleted: true,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save toss configuration")
      }

      const tossWinnerName = tossWinner === homeTeam.id ? homeTeam.name : awayTeam.name
      const whiteTeamName = whiteTeamId === homeTeam.id ? homeTeam.name : awayTeam.name

      toast({
        title: "Toss Recorded!",
        description: `${tossWinnerName} won the toss and chose to ${
          tossDecision === "color"
            ? `play ${colorChoice}`
            : `take ${sideChoice === "home" ? "home" : "away"} side`
        }. ${whiteTeamName} will play white (moves first).`,
      })

      onComplete({
        tossWinnerTeamId: tossWinner,
        tossDecision,
        selectedColor,
        whiteTeamId,
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
            ♟️ Chess Toss Configuration
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
              <Select value={tossDecision} onValueChange={(val) => setTossDecision(val as "color" | "side")}>
                <SelectTrigger id="toss-decision" className="h-12">
                  <SelectValue placeholder="Select decision" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="color">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🎨</span>
                      <span className="font-medium">Choose Color</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="side">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">📍</span>
                      <span className="font-medium">Choose Side</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Color Selection (if applicable) */}
          {tossWinner && tossDecision === "color" && (
            <div className="space-y-2">
              <Label htmlFor="color-choice" className="text-base font-semibold">
                Which color does {tossWinnerName} want to play?
              </Label>
              <Select value={colorChoice} onValueChange={(val) => setColorChoice(val as "white" | "black")}>
                <SelectTrigger id="color-choice" className="h-12">
                  <SelectValue placeholder="Select color" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="white">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">⚪</span>
                      <span className="font-medium">White (Moves First)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="black">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">⚫</span>
                      <span className="font-medium">Black (Moves Second)</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Side Selection (if applicable) */}
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
                Note: The opposite team will play white (moves first)
              </p>
            </div>
          )}

          {/* Summary */}
          {tossWinner && tossDecision && (tossDecision === "color" ? colorChoice : sideChoice) && (
            <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
              <h4 className="font-semibold text-green-900 mb-2">Configuration Summary:</h4>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• Toss Winner: <span className="font-bold">{tossWinnerName}</span></li>
                <li>
                  • {tossWinnerName} chose:{" "}
                  <span className="font-bold">
                    {tossDecision === "color"
                      ? `${colorChoice === "white" ? "White" : "Black"}`
                      : `${sideChoice === "home" ? "Home" : "Away"} Side`}
                  </span>
                </li>
                <li>
                  • White Team (Moves First):{" "}
                  <span className="font-bold">
                    {tossDecision === "color"
                      ? colorChoice === "white"
                        ? tossWinnerName
                        : (tossWinner === homeTeam.id ? awayTeam.name : homeTeam.name)
                      : sideChoice === "home"
                        ? awayTeam.name
                        : homeTeam.name}
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
            disabled={saving || !tossWinner || !tossDecision || (tossDecision === "color" && !colorChoice) || (tossDecision === "side" && !sideChoice)}
            className="flex-1"
          >
            {saving ? "Saving..." : "Confirm Toss"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

