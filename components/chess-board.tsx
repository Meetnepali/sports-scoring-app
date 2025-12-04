"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"

interface ChessBoardProps {
  games: any[]
  homeTeam: any
  awayTeam: any
  onUpdateGame?: (gameIndex: number, result: string) => void
}

export default function ChessBoard({ games, homeTeam, awayTeam, onUpdateGame }: ChessBoardProps) {
  const [selectedGame, setSelectedGame] = useState(0)

  // Get player names
  const getPlayerName = (playerId: string) => {
    const allPlayers = [...homeTeam.players, ...awayTeam.players]
    const player = allPlayers.find((p) => p.id === playerId)
    return player ? player.name : "Unknown Player"
  }

  // Chess piece symbols
  const pieces = {
    white: {
      king: "♔",
      queen: "♕",
      rook: "♖",
      bishop: "♗",
      knight: "♘",
      pawn: "♙",
    },
    black: {
      king: "♚",
      queen: "♛",
      rook: "♜",
      bishop: "♝",
      knight: "♞",
      pawn: "♟",
    },
  }

  // Initial board setup (simplified for visualization)
  const initialBoard = [
    ["r", "n", "b", "q", "k", "b", "n", "r"],
    ["p", "p", "p", "p", "p", "p", "p", "p"],
    ["", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", ""],
    ["P", "P", "P", "P", "P", "P", "P", "P"],
    ["R", "N", "B", "Q", "K", "B", "N", "R"],
  ]

  // Convert piece notation to Unicode symbol
  const getPieceSymbol = (piece: string) => {
    if (!piece) return ""
    const color = piece === piece.toUpperCase() ? "white" : "black"
    const pieceType = piece.toLowerCase()

    switch (pieceType) {
      case "k":
        return color === "white" ? pieces.white.king : pieces.black.king
      case "q":
        return color === "white" ? pieces.white.queen : pieces.black.queen
      case "r":
        return color === "white" ? pieces.white.rook : pieces.black.rook
      case "b":
        return color === "white" ? pieces.white.bishop : pieces.black.bishop
      case "n":
        return color === "white" ? pieces.white.knight : pieces.black.knight
      case "p":
        return color === "white" ? pieces.white.pawn : pieces.black.pawn
      default:
        return ""
    }
  }

  // Get result badge color
  const getResultBadgeColor = (result: string) => {
    if (result === "1-0") return "bg-red-100 text-red-800"
    if (result === "0-1") return "bg-blue-100 text-blue-800"
    if (result === "½-½") return "bg-yellow-100 text-yellow-800"
    return "bg-gray-100 text-gray-800"
  }

  // Get result text
  const getResultText = (result: string, player1: string, player2: string) => {
    if (result === "1-0") return `${getPlayerName(player1)} wins`
    if (result === "0-1") return `${getPlayerName(player2)} wins`
    if (result === "½-½") return "Draw"
    return "Ongoing"
  }

  // Get file label (a-h)
  const getFileLabel = (index: number) => {
    return String.fromCharCode(97 + index)
  }

  // Get rank label (1-8)
  const getRankLabel = (index: number) => {
    return 8 - index
  }

  return (
    <div className="w-full">
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold">Current Games</h3>
          <div className="flex gap-2">
            {games.map((game, index) => (
              <Badge
                key={index}
                className={`cursor-pointer ${selectedGame === index ? "bg-blue-500 text-white" : "bg-gray-100"}`}
                onClick={() => setSelectedGame(index)}
              >
                Board {index + 1}
              </Badge>
            ))}
          </div>
        </div>

        {games[selectedGame] && (
          <div className="bg-gray-50 p-3 rounded-lg border flex justify-between items-center">
            <div className="font-medium">{getPlayerName(games[selectedGame].player1)}</div>
            <Badge className={getResultBadgeColor(games[selectedGame].result)}>
              {getResultText(games[selectedGame].result, games[selectedGame].player1, games[selectedGame].player2)}
            </Badge>
            <div className="font-medium">{getPlayerName(games[selectedGame].player2)}</div>
          </div>
        )}
      </div>

      <div className="flex justify-center">
        <div className="relative w-full max-w-md aspect-square bg-gray-100 border rounded-lg overflow-hidden">
          {/* File labels (a-h) - top */}
          <div className="absolute top-0 left-0 w-full h-6 flex">
            <div className="w-6"></div>
            {Array(8)
              .fill(0)
              .map((_, i) => (
                <div key={`file-top-${i}`} className="flex-1 flex items-center justify-center text-xs text-gray-500">
                  {getFileLabel(i)}
                </div>
              ))}
            <div className="w-6"></div>
          </div>

          {/* Rank labels (1-8) - left */}
          <div className="absolute top-6 left-0 h-[calc(100%-12px)] w-6 flex flex-col">
            {Array(8)
              .fill(0)
              .map((_, i) => (
                <div key={`rank-left-${i}`} className="flex-1 flex items-center justify-center text-xs text-gray-500">
                  {getRankLabel(i)}
                </div>
              ))}
          </div>

          {/* Rank labels (1-8) - right */}
          <div className="absolute top-6 right-0 h-[calc(100%-12px)] w-6 flex flex-col">
            {Array(8)
              .fill(0)
              .map((_, i) => (
                <div key={`rank-right-${i}`} className="flex-1 flex items-center justify-center text-xs text-gray-500">
                  {getRankLabel(i)}
                </div>
              ))}
          </div>

          {/* File labels (a-h) - bottom */}
          <div className="absolute bottom-0 left-0 w-full h-6 flex">
            <div className="w-6"></div>
            {Array(8)
              .fill(0)
              .map((_, i) => (
                <div key={`file-bottom-${i}`} className="flex-1 flex items-center justify-center text-xs text-gray-500">
                  {getFileLabel(i)}
                </div>
              ))}
            <div className="w-6"></div>
          </div>

          {/* Chess board */}
          <div className="absolute top-6 left-6 right-6 bottom-6 grid grid-cols-8 grid-rows-8">
            {initialBoard.map((row, rowIndex) =>
              row.map((piece, colIndex) => (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={`flex items-center justify-center text-3xl
                    ${(rowIndex + colIndex) % 2 === 0 ? "bg-amber-200" : "bg-amber-800 text-white"}`}
                >
                  {getPieceSymbol(piece)}
                </div>
              )),
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 text-center text-sm text-gray-500">
        {games[selectedGame]?.result === "ongoing" ? (
          <p>Game in progress</p>
        ) : (
          <p>Game completed: {games[selectedGame]?.result}</p>
        )}
      </div>
    </div>
  )
}
