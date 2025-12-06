"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Coins, Trophy } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Team {
  id: string
  name: string
}

interface TossConfigurationDialogProps {
  open: boolean
  matchId: string
  homeTeam: Team
  awayTeam: Team
  totalOvers: number
  maxOversPerBowler: number
  onComplete: (config: {
    tossWinnerTeamId: string
    tossDecision: 'bat' | 'bowl'
    electedToBatFirstTeamId: string
  }) => void
  onCancel?: () => void
}

export function TossConfigurationDialog({
  open,
  matchId,
  homeTeam,
  awayTeam,
  totalOvers,
  maxOversPerBowler,
  onComplete,
  onCancel,
}: TossConfigurationDialogProps) {
  const [tossWinner, setTossWinner] = useState<string>("")
  const [tossDecision, setTossDecision] = useState<'bat' | 'bowl' | "">("")
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const handleSave = async () => {
    if (!tossWinner || !tossDecision) {
      toast({
        title: "Incomplete Information",
        description: "Please select toss winner and their decision",
        variant: "destructive",
      })
      return
    }

    setSaving(true)

    try {
      // Determine which team bats first
      const electedToBatFirstTeamId =
        tossDecision === 'bat'
          ? tossWinner
          : tossWinner === homeTeam.id
          ? awayTeam.id
          : homeTeam.id

      // Save toss configuration
      const response = await fetch(`/api/matches/${matchId}/cricket/config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          totalOvers,
          maxOversPerBowler,
          tossWinnerTeamId: tossWinner,
          tossDecision,
          electedToBatFirstTeamId,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save toss configuration")
      }

      toast({
        title: "Toss Recorded!",
        description: `${
          tossWinner === homeTeam.id ? homeTeam.name : awayTeam.name
        } won the toss and chose to ${tossDecision === 'bat' ? 'bat' : 'bowl'} first`,
      })

      onComplete({
        tossWinnerTeamId: tossWinner,
        tossDecision,
        electedToBatFirstTeamId,
      })
    } catch (error) {
      console.error("Error saving toss:", error)
      toast({
        title: "Error",
        description: "Failed to save toss configuration",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const tossWinnerName = tossWinner === homeTeam.id ? homeTeam.name : tossWinner === awayTeam.id ? awayTeam.name : ""

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel?.()}>
      <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Coins className="h-6 w-6 text-yellow-500" />
            Toss Configuration
          </DialogTitle>
          <DialogDescription>
            Configure the toss before starting the match. This can only be done once.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4 overflow-y-auto flex-1">
          {/* Match Info */}
          <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-sm text-gray-600">Match Format</span>
              <Trophy className="h-4 w-4 text-blue-500" />
            </div>
            <div className="text-lg font-bold">{totalOvers} Overs</div>
            <div className="text-sm text-gray-600 mt-1">
              Max {maxOversPerBowler} overs per bowler
            </div>
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
                    <span className="text-lg">🏏</span>
                    <span>{homeTeam.name}</span>
                  </div>
                </SelectItem>
                <SelectItem value={awayTeam.id}>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🏏</span>
                    <span>{awayTeam.name}</span>
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
              <Select value={tossDecision} onValueChange={(val) => setTossDecision(val as 'bat' | 'bowl')}>
                <SelectTrigger id="toss-decision" className="h-12">
                  <SelectValue placeholder="Select decision" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bat">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🏏</span>
                      <span className="font-medium">Bat First</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="bowl">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">⚾</span>
                      <span className="font-medium">Bowl First</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Summary */}
          {tossWinner && tossDecision && (
            <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
              <div className="text-sm font-semibold text-green-800 mb-1">Summary:</div>
              <div className="text-base">
                <span className="font-bold">{tossWinnerName}</span> won the toss and elected to{" "}
                <span className="font-bold">{tossDecision === 'bat' ? 'bat' : 'bowl'}</span> first
              </div>
              <div className="text-sm text-green-700 mt-2">
                {tossDecision === 'bat' ? tossWinnerName : tossWinner === homeTeam.id ? awayTeam.name : homeTeam.name}{" "}
                will bat first
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 flex-shrink-0 pt-4 border-t">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={saving}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!tossWinner || !tossDecision || saving}
            className="flex-1"
          >
            {saving ? "Saving..." : "Start Match"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

