"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trophy, Star, TrendingUp } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Player {
  id: string
  name: string
  team_name: string
}

interface Suggestion {
  playerId: string
  reason: string
  player: Player
}

interface ManOfMatchSelectorProps {
  open: boolean
  matchId: string
  onComplete: (playerId: string) => void
  onCancel?: () => void
}

export function ManOfMatchSelector({
  open,
  matchId,
  onComplete,
  onCancel,
}: ManOfMatchSelectorProps) {
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null)
  const [candidates, setCandidates] = useState<{ batStats: any[]; bowlStats: any[] }>({ batStats: [], bowlStats: [] })
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      fetchSuggestion()
    }
  }, [open, matchId])

  const fetchSuggestion = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/matches/${matchId}/cricket/man-of-match`)
      
      if (response.ok) {
        const data = await response.json()
        setSuggestion(data.suggestion)
        setCandidates(data.candidates)
        
        // Auto-select suggestion
        if (data.suggestion) {
          setSelectedPlayerId(data.suggestion.playerId)
        }
      }
    } catch (error) {
      console.error("Error fetching man of match suggestion:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!selectedPlayerId) {
      toast({
        title: "No Selection",
        description: "Please select a player for Man of the Match",
        variant: "destructive",
      })
      return
    }

    setSaving(true)

    try {
      const response = await fetch(`/api/matches/${matchId}/cricket/man-of-match`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          manOfMatchPlayerId: selectedPlayerId,
          matchStatus: 'completed',
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save man of match")
      }

      const selectedPlayer = 
        suggestion?.playerId === selectedPlayerId 
          ? suggestion.player.name 
          : candidates.batStats.find(b => b.playerId === selectedPlayerId)?.playerName ||
            candidates.bowlStats.find(b => b.playerId === selectedPlayerId)?.playerName

      toast({
        title: "Man of the Match Selected!",
        description: `${selectedPlayer} has been awarded Man of the Match`,
      })

      onComplete(selectedPlayerId)
    } catch (error) {
      console.error("Error saving man of match:", error)
      toast({
        title: "Error",
        description: "Failed to save Man of the Match selection",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel?.()}>
        <DialogContent className="sm:max-w-lg">
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500">Analyzing performance...</div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel?.()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Trophy className="h-6 w-6 text-yellow-500" />
            Select Man of the Match
          </DialogTitle>
          <DialogDescription>
            Choose the best performer of the match. A suggestion is provided based on statistics.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* AI Suggestion */}
          {suggestion && (
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-lg border-2 border-yellow-300">
              <div className="flex items-center gap-2 mb-2">
                <Star className="h-5 w-5 text-yellow-600" />
                <span className="font-bold text-yellow-900">Suggested Winner</span>
              </div>
              <div className="text-lg font-bold text-gray-900">{suggestion.player.name}</div>
              <div className="text-sm text-gray-700 mt-1">{suggestion.player.team_name}</div>
              <div className="text-sm text-yellow-800 mt-2 flex items-start gap-2">
                <TrendingUp className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{suggestion.reason}</span>
              </div>
            </div>
          )}

          {/* Manual Selection */}
          <div className="space-y-2">
            <Label htmlFor="man-of-match" className="text-base font-semibold">
              Select Man of the Match
            </Label>
            <Select value={selectedPlayerId} onValueChange={setSelectedPlayerId}>
              <SelectTrigger id="man-of-match" className="h-12">
                <SelectValue placeholder="Choose a player" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {/* Batting Candidates */}
                {candidates.batStats.length > 0 && (
                  <>
                    <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50">
                      Top Batsmen
                    </div>
                    {candidates.batStats.slice(0, 5).map((bat) => (
                      <SelectItem key={bat.playerId} value={bat.playerId}>
                        <div className="flex flex-col">
                          <span className="font-medium">{bat.playerName}</span>
                          <span className="text-xs text-gray-500">
                            {bat.runs} runs off {bat.balls} balls (SR: {((bat.runs / bat.balls) * 100).toFixed(1)})
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </>
                )}
                
                {/* Bowling Candidates */}
                {candidates.bowlStats.length > 0 && (
                  <>
                    <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50 mt-2">
                      Top Bowlers
                    </div>
                    {candidates.bowlStats.slice(0, 5).map((bowl) => (
                      <SelectItem key={bowl.playerId} value={bowl.playerId}>
                        <div className="flex flex-col">
                          <span className="font-medium">{bowl.playerName}</span>
                          <span className="text-xs text-gray-500">
                            {bowl.wickets} wickets, {bowl.runs} runs (Econ: {(bowl.runs / (bowl.overs * 6)).toFixed(2)})
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Selected Player Info */}
          {selectedPlayerId && (
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <div className="text-sm font-semibold text-blue-800">
                {selectedPlayerId === suggestion?.playerId ? "✓ Using suggested winner" : "Custom selection"}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2">
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
            disabled={!selectedPlayerId || saving}
            className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white"
          >
            {saving ? "Saving..." : "Confirm Selection"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

