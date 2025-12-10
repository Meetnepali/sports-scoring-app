"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import type { Team } from "@/lib/static-data"
import { Card } from "@/components/ui/card"

interface MatchAssignment {
  matchNumber: number
  type: "singles" | "doubles"
  homePlayerIds: string[]
  awayPlayerIds: string[]
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
    matches: MatchAssignment[]
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
  const [step, setStep] = useState<"toss" | "matches">("toss")
  const [matches, setMatches] = useState<MatchAssignment[]>([])
  const [matchTypes, setMatchTypes] = useState<Array<"singles" | "doubles">>([])
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
          setMatchTypes(types)
          
          // Initialize matches array with configured types
          const initialMatches: MatchAssignment[] = []
          for (let i = 0; i < numMatches; i++) {
            initialMatches.push({
              matchNumber: i + 1,
              type: types[i] || "singles",
              homePlayerIds: [],
              awayPlayerIds: []
            })
          }
          setMatches(initialMatches)
        } else {
          // Fallback to 3 matches if config not found
          const defaultMatches = [
            { matchNumber: 1, type: "singles" as const, homePlayerIds: [], awayPlayerIds: [] },
            { matchNumber: 2, type: "singles" as const, homePlayerIds: [], awayPlayerIds: [] },
            { matchNumber: 3, type: "singles" as const, homePlayerIds: [], awayPlayerIds: [] },
          ]
          setMatches(defaultMatches)
          setMatchTypes(["singles", "singles", "singles"])
        }
      } catch (error) {
        console.error("Error fetching config:", error)
        // Fallback to 3 matches
        const defaultMatches = [
          { matchNumber: 1, type: "singles" as const, homePlayerIds: [], awayPlayerIds: [] },
          { matchNumber: 2, type: "singles" as const, homePlayerIds: [], awayPlayerIds: [] },
          { matchNumber: 3, type: "singles" as const, homePlayerIds: [], awayPlayerIds: [] },
        ]
        setMatches(defaultMatches)
        setMatchTypes(["singles", "singles", "singles"])
      } finally {
        setLoading(false)
      }
    }
    
    fetchConfig()
  }, [open, matchId])

  const handleNextToMatches = () => {
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

    setStep("matches")
  }

  const updateMatchType = (matchIndex: number, type: "singles" | "doubles") => {
    const newMatches = [...matches]
    newMatches[matchIndex].type = type
    // Reset player selections when changing type
    newMatches[matchIndex].homePlayerIds = []
    newMatches[matchIndex].awayPlayerIds = []
    setMatches(newMatches)
  }

  const updateMatchPlayers = (matchIndex: number, team: "home" | "away", playerIds: string[]) => {
    const newMatches = [...matches]
    if (team === "home") {
      newMatches[matchIndex].homePlayerIds = playerIds
    } else {
      newMatches[matchIndex].awayPlayerIds = playerIds
    }
    setMatches(newMatches)
  }

  const validateMatches = () => {
    for (const match of matches) {
      const requiredPlayers = match.type === "singles" ? 1 : 2
      if (match.homePlayerIds.length !== requiredPlayers || match.awayPlayerIds.length !== requiredPlayers) {
        return false
      }
    }
    return true
  }

  const handleSave = async () => {
    if (!validateMatches()) {
      toast({
        title: "Incomplete Player Assignments",
        description: "Please assign players to all matches",
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

      // Save toss configuration with match assignments
      const response = await fetch(`/api/matches/${matchId}/badminton/config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tossWinnerTeamId: tossWinner,
          tossDecision,
          selectedCourtSide,
          servingTeam,
          configCompleted: true,
          matches,
        }),
      })


      if (!response.ok) {
        throw new Error("Failed to save toss configuration")
      }

      const tossWinnerName = tossWinner === homeTeam.id ? homeTeam.name : awayTeam.name

      toast({
        title: "Configuration Complete!",
        description: `Match setup completed. Ready to begin.`,
      })

      onComplete({
        tossWinnerTeamId: tossWinner,
        tossDecision,
        selectedCourtSide,
        servingTeam,
        matches,
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

  const getPlayerName = (playerId: string) => {
    const allPlayers = [...homeTeam.players, ...awayTeam.players]
    return allPlayers.find(p => p.id === playerId)?.name || "Unknown"
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel?.()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-2xl flex items-center gap-2">
            🏸 Badminton Match Configuration {step === "matches" && "- Player Assignments"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4 overflow-y-auto flex-1">
          {step === "toss" && (
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
          </>
          )}

          {/* Match Assignments Step */}
          {step === "matches" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Assign players for each of the {matches.length} matches. All matches will be played compulsorily.
              </p>
              
              {matches.map((match, index) => (
                <Card key={index} className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">Match {match.matchNumber}</h4>
                    <div className="px-3 py-2 bg-gray-100 rounded-md">
                      <span className="text-sm font-medium">{match.type === "singles" ? "Singles" : "Doubles"}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Home Team Players */}
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold">{homeTeam.name}</Label>
                      {match.type === "singles" ? (
                        <Select
                          value={match.homePlayerIds[0] || ""}
                          onValueChange={(value) => updateMatchPlayers(index, "home", [value])}
                        >
                          <SelectTrigger className="h-10">
                            <SelectValue placeholder="Select player" />
                          </SelectTrigger>
                          <SelectContent>
                            {homeTeam.players.map((player) => (
                              <SelectItem key={player.id} value={player.id}>
                                {player.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <>
                          <Select
                            value={match.homePlayerIds[0] || ""}
                            onValueChange={(value) => {
                              const newIds = [value, match.homePlayerIds[1] || ""]
                              updateMatchPlayers(index, "home", newIds.filter(id => id))
                            }}
                          >
                            <SelectTrigger className="h-10">
                              <SelectValue placeholder="Player 1" />
                            </SelectTrigger>
                            <SelectContent>
                              {homeTeam.players.map((player) => (
                                <SelectItem key={player.id} value={player.id}>
                                  {player.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select
                            value={match.homePlayerIds[1] || ""}
                            onValueChange={(value) => {
                              const newIds = [match.homePlayerIds[0] || "", value]
                              updateMatchPlayers(index, "home", newIds.filter(id => id))
                            }}
                          >
                            <SelectTrigger className="h-10">
                              <SelectValue placeholder="Player 2" />
                            </SelectTrigger>
                            <SelectContent>
                              {homeTeam.players.map((player) => (
                                <SelectItem key={player.id} value={player.id}>
                                  {player.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </>
                      )}
                    </div>

                    {/* Away Team Players */}
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold">{awayTeam.name}</Label>
                      {match.type === "singles" ? (
                        <Select
                          value={match.awayPlayerIds[0] || ""}
                          onValueChange={(value) => updateMatchPlayers(index, "away", [value])}
                        >
                          <SelectTrigger className="h-10">
                            <SelectValue placeholder="Select player" />
                          </SelectTrigger>
                          <SelectContent>
                            {awayTeam.players.map((player) => (
                              <SelectItem key={player.id} value={player.id}>
                                {player.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <>
                          <Select
                            value={match.awayPlayerIds[0] || ""}
                            onValueChange={(value) => {
                              const newIds = [value, match.awayPlayerIds[1] || ""]
                              updateMatchPlayers(index, "away", newIds.filter(id => id))
                            }}
                          >
                            <SelectTrigger className="h-10">
                              <SelectValue placeholder="Player 1" />
                            </SelectTrigger>
                            <SelectContent>
                              {awayTeam.players.map((player) => (
                                <SelectItem key={player.id} value={player.id}>
                                  {player.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select
                            value={match.awayPlayerIds[1] || ""}
                            onValueChange={(value) => {
                              const newIds = [match.awayPlayerIds[0] || "", value]
                              updateMatchPlayers(index, "away", newIds.filter(id => id))
                            }}
                          >
                            <SelectTrigger className="h-10">
                              <SelectValue placeholder="Player 2" />
                            </SelectTrigger>
                            <SelectContent>
                              {awayTeam.players.map((player) => (
                                <SelectItem key={player.id} value={player.id}>
                                  {player.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3 flex-shrink-0 pt-4 border-t">
          {step === "toss" ? (
            <>
              <Button variant="outline" onClick={onCancel} disabled={saving} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={handleNextToMatches}
                disabled={!tossWinner || !tossDecision || (tossDecision === "court_side" && !courtSideChoice) || (tossDecision === "serve" && !oppositeTeamCourtSideChoice)}
                className="flex-1"
              >
                Next: Player Assignments
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setStep("toss")} disabled={saving} className="flex-1">
                Back
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving || !validateMatches()}
                className="flex-1"
              >
                {saving ? "Saving..." : "Complete Setup"}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

