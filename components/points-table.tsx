"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import type { Team, GroupTeam } from "@/lib/static-data"

interface TeamStats {
  team: Team
  played: number
  wins: number
  losses: number
  draws: number
  pointsDifference: number
  totalPoints: number
  // Cricket-specific
  runRate?: number
  // Volleyball/other sports
  pointsFor?: number
  pointsAgainst?: number
}

interface PointsTableProps {
  teams: GroupTeam[]
  matches: any[]
  sport: string
}

export function PointsTable({ teams, matches, sport }: PointsTableProps) {
  // Calculate statistics for each team
  const calculateStats = (): TeamStats[] => {
    const stats: Record<string, TeamStats> = {}

    // Initialize stats for all teams
    teams.forEach((groupTeam) => {
      if (groupTeam.team) {
        stats[groupTeam.teamId] = {
          team: groupTeam.team,
          played: 0,
          wins: 0,
          losses: 0,
          draws: 0,
          pointsDifference: 0,
          totalPoints: 0,
          pointsFor: 0,
          pointsAgainst: 0,
        }
      }
    })

    // Process matches
    matches.forEach((match) => {
      if (!match.winnerId || !match.score) return

      const team1Stats = stats[match.nodeData?.team1Id || match.team1Id]
      const team2Stats = stats[match.nodeData?.team2Id || match.team2Id]

      if (!team1Stats || !team2Stats) return

      // Calculate based on sport
      if (sport === "cricket") {
        const team1Score = match.score.team1 || 0
        const team2Score = match.score.team2 || 0
        const team1Overs = calculateOvers(match.score.team1Overs || 0)
        const team2Overs = calculateOvers(match.score.team2Overs || 0)

        team1Stats.played++
        team2Stats.played++

        if (match.winnerId === match.nodeData?.team1Id || match.winnerId === match.team1Id) {
          team1Stats.wins++
          team2Stats.losses++
          team1Stats.totalPoints += 2
        } else if (match.winnerId === match.nodeData?.team2Id || match.winnerId === match.team2Id) {
          team2Stats.wins++
          team1Stats.losses++
          team2Stats.totalPoints += 2
        } else {
          team1Stats.draws++
          team2Stats.draws++
          team1Stats.totalPoints += 1
          team2Stats.totalPoints += 1
        }

        // Calculate run rate
        const team1RR = team1Overs > 0 ? team1Score / team1Overs : 0
        const team2RR = team2Overs > 0 ? team2Score / team2Overs : 0
        const team1ConcededRR = team2Overs > 0 ? team2Score / team2Overs : 0
        const team2ConcededRR = team1Overs > 0 ? team1Score / team1Overs : 0

        team1Stats.runRate = team1RR - team1ConcededRR
        team2Stats.runRate = team2RR - team2ConcededRR

        team1Stats.pointsFor = team1Score
        team1Stats.pointsAgainst = team2Score
        team2Stats.pointsFor = team2Score
        team2Stats.pointsAgainst = team1Score
      } else if (sport === "volleyball") {
        // For volleyball, extract points from sets
        let team1Total = 0
        let team2Total = 0

        if (match.score.sets) {
          match.score.sets.forEach((set: any) => {
            team1Total += set.home || set.team1 || 0
            team2Total += set.away || set.team2 || 0
          })
        }

        team1Stats.played++
        team2Stats.played++

        if (match.winnerId === match.nodeData?.team1Id || match.winnerId === match.team1Id) {
          team1Stats.wins++
          team2Stats.losses++
          team1Stats.totalPoints += 2
        } else if (match.winnerId === match.nodeData?.team2Id || match.winnerId === match.team2Id) {
          team2Stats.wins++
          team1Stats.losses++
          team2Stats.totalPoints += 2
        } else {
          team1Stats.draws++
          team2Stats.draws++
          team1Stats.totalPoints += 1
          team2Stats.totalPoints += 1
        }

        team1Stats.pointsDifference = team1Total - team2Total
        team2Stats.pointsDifference = team2Total - team1Total
        team1Stats.pointsFor = team1Total
        team1Stats.pointsAgainst = team2Total
        team2Stats.pointsFor = team2Total
        team2Stats.pointsAgainst = team1Total
      } else {
        // Other sports (chess, futsal, table-tennis, badminton)
        const team1Score = match.score.team1 || 0
        const team2Score = match.score.team2 || 0

        team1Stats.played++
        team2Stats.played++

        if (match.winnerId === match.nodeData?.team1Id || match.winnerId === match.team1Id) {
          team1Stats.wins++
          team2Stats.losses++
          team1Stats.totalPoints += 2
        } else if (match.winnerId === match.nodeData?.team2Id || match.winnerId === match.team2Id) {
          team2Stats.wins++
          team1Stats.losses++
          team2Stats.totalPoints += 2
        } else {
          team1Stats.draws++
          team2Stats.draws++
          team1Stats.totalPoints += 1
          team2Stats.totalPoints += 1
        }

        team1Stats.pointsDifference = team1Score - team2Score
        team2Stats.pointsDifference = team2Score - team1Score
        team1Stats.pointsFor = team1Score
        team1Stats.pointsAgainst = team2Score
        team2Stats.pointsFor = team2Score
        team2Stats.pointsAgainst = team1Score
      }
    })

    // Convert to array and sort
    const sortedStats = Object.values(stats).sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints
      if (sport === "cricket" && a.runRate !== undefined && b.runRate !== undefined) {
        return b.runRate - a.runRate
      }
      return b.pointsDifference - a.pointsDifference
    })

    return sortedStats
  }

  // Helper function to convert overs to decimal (e.g., "12.3" -> 12.5)
  const calculateOvers = (overs: number | string): number => {
    if (typeof overs === "string") {
      const parts = overs.split(".")
      return parseFloat(parts[0]) + (parts[1] ? parseFloat(parts[1]) / 6 : 0)
    }
    return overs
  }

  const stats = calculateStats()

  return (
    <div className="rounded-lg border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">#</TableHead>
            <TableHead>Team</TableHead>
            <TableHead className="text-center">P</TableHead>
            <TableHead className="text-center">W</TableHead>
            <TableHead className="text-center">L</TableHead>
            <TableHead className="text-center">D</TableHead>
            {sport === "cricket" ? (
              <>
                <TableHead className="text-center">RR</TableHead>
              </>
            ) : (
              <>
                <TableHead className="text-center">PF</TableHead>
                <TableHead className="text-center">PA</TableHead>
                <TableHead className="text-center">Diff</TableHead>
              </>
            )}
            <TableHead className="text-center font-bold">Pts</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {stats.length === 0 ? (
            <TableRow>
              <TableCell colSpan={sport === "cricket" ? 8 : 10} className="text-center text-muted-foreground py-8">
                No teams in this group yet
              </TableCell>
            </TableRow>
          ) : (
            stats.map((stat, index) => (
              <TableRow key={stat.team.id} className={index === 0 ? "bg-primary/5 font-semibold" : ""}>
                <TableCell className="font-bold">{index + 1}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {stat.team.logo && (
                      <div className="w-8 h-8 relative">
                        <Image
                          src={stat.team.logo}
                          alt={stat.team.name}
                          fill
                          className="object-contain rounded"
                          sizes="32px"
                        />
                      </div>
                    )}
                    <span>{stat.team.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-center">{stat.played}</TableCell>
                <TableCell className="text-center">
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    {stat.wins}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="secondary" className="bg-red-100 text-red-800">
                    {stat.losses}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                    {stat.draws}
                  </Badge>
                </TableCell>
                {sport === "cricket" ? (
                  <TableCell className="text-center">
                    {stat.runRate !== undefined ? (
                      <span className={stat.runRate >= 0 ? "text-green-600" : "text-red-600"}>
                        {stat.runRate > 0 ? "+" : ""}
                        {stat.runRate.toFixed(2)}
                      </span>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                ) : (
                  <>
                    <TableCell className="text-center">{stat.pointsFor}</TableCell>
                    <TableCell className="text-center">{stat.pointsAgainst}</TableCell>
                    <TableCell className="text-center">
                      <span className={stat.pointsDifference >= 0 ? "text-green-600" : "text-red-600"}>
                        {stat.pointsDifference > 0 ? "+" : ""}
                        {stat.pointsDifference}
                      </span>
                    </TableCell>
                  </>
                )}
                <TableCell className="text-center font-bold text-lg">{stat.totalPoints}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}

