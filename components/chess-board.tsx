"use client"

import { useState } from "react"

interface ChessBoardProps {
  games: any[]
  homeTeam: any
  awayTeam: any
  onUpdateGame?: (gameIndex: number, result: string) => void
}

export default function ChessBoard({ games, homeTeam, awayTeam, onUpdateGame }: ChessBoardProps) {
  const [selectedGame, setSelectedGame] = useState(0)

  const getPlayerName = (playerId: string) => {
    const allPlayers = [...homeTeam.players, ...awayTeam.players]
    const player = allPlayers.find((p) => p.id === playerId)
    return player ? player.name : "Unknown Player"
  }

  const pieces = {
    white: { king: "\u2654", queen: "\u2655", rook: "\u2656", bishop: "\u2657", knight: "\u2658", pawn: "\u2659" },
    black: { king: "\u265A", queen: "\u265B", rook: "\u265C", bishop: "\u265D", knight: "\u265E", pawn: "\u265F" },
  }

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

  const getPieceSymbol = (piece: string) => {
    if (!piece) return ""
    const color = piece === piece.toUpperCase() ? "white" : "black"
    const pieceType = piece.toLowerCase()
    switch (pieceType) {
      case "k": return color === "white" ? pieces.white.king : pieces.black.king
      case "q": return color === "white" ? pieces.white.queen : pieces.black.queen
      case "r": return color === "white" ? pieces.white.rook : pieces.black.rook
      case "b": return color === "white" ? pieces.white.bishop : pieces.black.bishop
      case "n": return color === "white" ? pieces.white.knight : pieces.black.knight
      case "p": return color === "white" ? pieces.white.pawn : pieces.black.pawn
      default: return ""
    }
  }

  const getResultBadge = (result: string) => {
    if (result === "1-0") return { bg: "bg-red-500", text: "text-white", label: "White Wins" }
    if (result === "0-1") return { bg: "bg-blue-500", text: "text-white", label: "Black Wins" }
    if (result === "\u00BD-\u00BD") return { bg: "bg-yellow-500", text: "text-white", label: "Draw" }
    return { bg: "bg-emerald-500", text: "text-white", label: "In Progress" }
  }

  const getResultText = (result: string, player1: string, player2: string) => {
    if (result === "1-0") return `${getPlayerName(player1)} wins`
    if (result === "0-1") return `${getPlayerName(player2)} wins`
    if (result === "\u00BD-\u00BD") return "Draw"
    return "Ongoing"
  }

  const getFileLabel = (index: number) => String.fromCharCode(97 + index)
  const getRankLabel = (index: number) => 8 - index

  const currentGame = games[selectedGame]
  const resultInfo = currentGame ? getResultBadge(currentGame.result) : null

  return (
    <div className="w-full space-y-4">
      {/* Game Selector Tabs */}
      <div>
        <h3 className="font-semibold text-sm text-gray-500 uppercase tracking-wide mb-2">Select Board</h3>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {games.map((game, index) => (
            <button
              key={index}
              onClick={() => setSelectedGame(index)}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all duration-200
                ${selectedGame === index
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
            >
              Board {index + 1}
              {game.result && game.result !== "ongoing" && (
                <span className="ml-1.5 inline-block w-2 h-2 rounded-full bg-green-400" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Player Info & Result Panel */}
      {currentGame && (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-4">
            {/* Player 1 (White) */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-gray-300 flex items-center justify-center text-sm font-bold">
                W
              </div>
              <div>
                <p className="font-semibold text-sm">{getPlayerName(currentGame.player1)}</p>
                <p className="text-xs text-gray-400">White</p>
              </div>
            </div>

            {/* Result Badge */}
            <div className="flex flex-col items-center gap-1">
              {resultInfo && (
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${resultInfo.bg} ${resultInfo.text}`}>
                  {resultInfo.label}
                </span>
              )}
              <span className="text-xs text-gray-400 font-mono">
                {currentGame.result === "ongoing" ? "- vs -" : currentGame.result}
              </span>
            </div>

            {/* Player 2 (Black) */}
            <div className="flex items-center gap-3 text-right">
              <div>
                <p className="font-semibold text-sm">{getPlayerName(currentGame.player2)}</p>
                <p className="text-xs text-gray-400">Black</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-gray-800 border-2 border-gray-600 flex items-center justify-center text-sm font-bold text-white">
                B
              </div>
            </div>
          </div>

          {/* Move History Bar */}
          <div className="border-t bg-gray-50 px-4 py-2 flex items-center justify-between">
            <span className="text-xs text-gray-400">
              {currentGame.result === "ongoing"
                ? "Game in progress..."
                : `Game finished: ${getResultText(currentGame.result, currentGame.player1, currentGame.player2)}`}
            </span>
            {currentGame.result !== "ongoing" && (
              <span className="text-xs font-medium text-gray-500">Final</span>
            )}
          </div>
        </div>
      )}

      {/* Chess Board with Wooden Frame */}
      <div className="flex justify-center">
        <div
          className="relative w-full max-w-md aspect-square rounded-lg overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #5C3317 0%, #6B3A20 30%, #4A2810 70%, #5C3317 100%)",
            padding: "6px",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
          }}
        >
          {/* Inner wooden border */}
          <div
            className="w-full h-full relative rounded-sm overflow-hidden"
            style={{
              background: "linear-gradient(145deg, #7B4B2A 0%, #6B3E22 50%, #5A3018 100%)",
              padding: "2px",
            }}
          >
            <div className="w-full h-full relative bg-[#4A2810] rounded-sm overflow-hidden">
              {/* File labels (a-h) - top */}
              <div className="absolute top-0 left-0 w-full h-6 flex">
                <div className="w-6" />
                {Array(8).fill(0).map((_, i) => (
                  <div key={`file-top-${i}`} className="flex-1 flex items-center justify-center text-[10px] font-semibold text-[#C4A26E]">
                    {getFileLabel(i)}
                  </div>
                ))}
                <div className="w-6" />
              </div>

              {/* Rank labels (1-8) - left */}
              <div className="absolute top-6 left-0 h-[calc(100%-12px)] w-6 flex flex-col">
                {Array(8).fill(0).map((_, i) => (
                  <div key={`rank-left-${i}`} className="flex-1 flex items-center justify-center text-[10px] font-semibold text-[#C4A26E]">
                    {getRankLabel(i)}
                  </div>
                ))}
              </div>

              {/* Rank labels (1-8) - right */}
              <div className="absolute top-6 right-0 h-[calc(100%-12px)] w-6 flex flex-col">
                {Array(8).fill(0).map((_, i) => (
                  <div key={`rank-right-${i}`} className="flex-1 flex items-center justify-center text-[10px] font-semibold text-[#C4A26E]">
                    {getRankLabel(i)}
                  </div>
                ))}
              </div>

              {/* File labels (a-h) - bottom */}
              <div className="absolute bottom-0 left-0 w-full h-6 flex">
                <div className="w-6" />
                {Array(8).fill(0).map((_, i) => (
                  <div key={`file-bottom-${i}`} className="flex-1 flex items-center justify-center text-[10px] font-semibold text-[#C4A26E]">
                    {getFileLabel(i)}
                  </div>
                ))}
                <div className="w-6" />
              </div>

              {/* Chess board grid */}
              <div className="absolute top-6 left-6 right-6 bottom-6 grid grid-cols-8 grid-rows-8">
                {initialBoard.map((row, rowIndex) =>
                  row.map((piece, colIndex) => {
                    const isLight = (rowIndex + colIndex) % 2 === 0
                    return (
                      <div
                        key={`${rowIndex}-${colIndex}`}
                        className="flex items-center justify-center text-4xl select-none"
                        style={{
                          backgroundColor: isLight ? "#DEB887" : "#8B4513",
                          color: isLight ? "#1a1a1a" : "#f5f5f5",
                          boxShadow: isLight
                            ? "inset 1px 1px 2px rgba(255,255,255,0.3), inset -1px -1px 2px rgba(0,0,0,0.1)"
                            : "inset 1px 1px 2px rgba(255,255,255,0.08), inset -1px -1px 2px rgba(0,0,0,0.3)",
                          textShadow: isLight
                            ? "1px 1px 2px rgba(0,0,0,0.2)"
                            : "1px 1px 3px rgba(0,0,0,0.5)",
                        }}
                      >
                        {getPieceSymbol(piece)}
                      </div>
                    )
                  }),
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Game Results Summary */}
      <div className="bg-white rounded-xl border shadow-sm p-4">
        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">All Boards</h4>
        <div className="space-y-2">
          {games.map((game, index) => {
            const info = getResultBadge(game.result)
            return (
              <div
                key={index}
                onClick={() => setSelectedGame(index)}
                className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-colors
                  ${selectedGame === index ? "bg-gray-100 ring-1 ring-gray-200" : "hover:bg-gray-50"}`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-gray-400 w-4">{index + 1}</span>
                  <span className="text-sm font-medium">{getPlayerName(game.player1)}</span>
                  <span className="text-xs text-gray-400">vs</span>
                  <span className="text-sm font-medium">{getPlayerName(game.player2)}</span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${info.bg} ${info.text}`}>
                  {info.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
