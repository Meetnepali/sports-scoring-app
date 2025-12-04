"use client"

import Link from "next/link"
import type React from "react"
import { useState, useRef, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import * as XLSX from "xlsx"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { PageTransition } from "@/components/page-transition"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { PlusCircle, Trash2, Upload, User, X, Save, ChevronsUpDown, Check, Loader2, Sparkles, FileText, UserPlus } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import Image from "next/image"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"

type UserOption = {
  id: string
  fullName: string
  username: string
  email: string
  profilePhoto?: string
  phoneNumber?: string
}

type PlayerFormEntry = {
  id: string
  userId: string | null
  userName: string
  number?: number | ""
  position?: string
  profilePhoto?: string
  phoneNumber?: string
}

export default function CreateTeamPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editTeamId = searchParams?.get('edit') || null
  const [isEditMode, setIsEditMode] = useState(!!editTeamId)
  const [originalTeamData, setOriginalTeamData] = useState<any>(null)
  const [isLoadingTeam, setIsLoadingTeam] = useState(false)
  const [sport, setSport] = useState("")
  const [teamName, setTeamName] = useState("")
  const [players, setPlayers] = useState<PlayerFormEntry[]>([])
  const [teamLogo, setTeamLogo] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [createdTeam, setCreatedTeam] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<"details" | "players">("details")
  const [userOptions, setUserOptions] = useState<UserOption[]>([])
  const [usersLoading, setUsersLoading] = useState(true)
  const [usersError, setUsersError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [openPlayerId, setOpenPlayerId] = useState<string | null>(null)
  const [isManualDialogOpen, setIsManualDialogOpen] = useState(false)
  const [isCSVUploading, setIsCSVUploading] = useState(false)
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const csvInputRef = useRef<HTMLInputElement>(null)
  
  // Manual player form state
  const [manualPlayerData, setManualPlayerData] = useState({
    username: "",
    full_name: "",
    email: "",
    phone_number: "",
    number: "",
    password: "",
  })
  const [isCreatingManualPlayer, setIsCreatingManualPlayer] = useState(false)

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch("/api/users")
        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || "Failed to load users")
        }

        const data = await response.json()
        setUserOptions(
          (data || []).map((user: any) => ({
            id: user.id,
            fullName: user.fullName || user.full_name || "",
            username: user.username,
            email: user.email,
            profilePhoto: user.profilePhoto,
            phoneNumber: user.phoneNumber,
          })),
        )
      } catch (error) {
        console.error("Error fetching users:", error)
        setUsersError(error instanceof Error ? error.message : "Failed to load users")
      } finally {
        setUsersLoading(false)
      }
    }

    fetchUsers()
  }, [])

  // Fetch team data for edit mode
  useEffect(() => {
    if (editTeamId) {
      setIsLoadingTeam(true)
      fetch(`/api/teams/${editTeamId}`)
        .then(res => res.json())
        .then(team => {
          setOriginalTeamData(team)
          setSport(team.sport)
          setTeamName(team.name)
          setTeamLogo(team.logo)
          
          // Map players with user IDs
          const teamPlayers = team.players.map((p: any) => ({
            id: crypto.randomUUID(),
            userId: p.userId,
            userName: p.name,
            number: p.number || "",
            position: p.position || ""
          }))
          setPlayers(teamPlayers)
        })
        .catch(err => setFormError('Failed to load team data'))
        .finally(() => setIsLoadingTeam(false))
    }
  }, [editTeamId])

  // Sport options
  const sportOptions = [
    { id: "cricket", name: "Cricket", playerCount: 11, hasPositions: false, hasNumbers: true },
    { id: "volleyball", name: "Volleyball", playerCount: 7, hasPositions: true, hasNumbers: true },
    { id: "chess", name: "Chess", playerCount: 4, hasPositions: false, hasNumbers: false },
    { id: "futsal", name: "Futsal", playerCount: 5, hasPositions: true, hasNumbers: true },
    { id: "table-tennis", name: "Table Tennis", playerCount: 2, hasPositions: false, hasNumbers: true },
    { id: "badminton", name: "Badminton", playerCount: 2, hasPositions: false, hasNumbers: true },
  ]

  // Position options for different sports
  const getPositionsForSport = (sportId: string) => {
    switch (sportId) {
      case "volleyball":
        return ["Setter", "Outside Hitter", "Middle Blocker", "Opposite", "Libero"]
      case "futsal":
        return ["Goalkeeper", "Defender", "Winger", "Pivot"]
      case "cricket":
        return ["Batsman", "Bowler", "All-rounder", "Wicket-keeper"]
      case "table-tennis":
        return ["Singles Player", "Doubles Player"]
      case "badminton":
        return ["Singles Player", "Doubles Player", "Mixed Doubles Player"]
      default:
        return []
    }
  }

  // Handle sport change
  const handleSportChange = (selectedSport: string) => {
    setSport(selectedSport)
    setActiveTab("details")
    setFormError(null)
    const sportOption = sportOptions.find((option) => option.id === selectedSport)
    if (sportOption) {
      const positions = getPositionsForSport(selectedSport)
      const defaultPlayers: PlayerFormEntry[] = Array.from({ length: sportOption.playerCount }, (_, index) => ({
        id:
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `player-${selectedSport}-${Date.now()}-${index}`,
        userId: null,
        userName: "",
        number: sportOption.hasNumbers ? index + 1 : undefined,
        position: positions.length > 0 ? positions[index % positions.length] : undefined,
      }))
      setPlayers(defaultPlayers)
    } else {
      setPlayers([])
    }
    setOpenPlayerId(null)
  }

  // Handle logo upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          setTeamLogo(event.target.result as string)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  // Remove logo
  const removeLogo = () => {
    setTeamLogo(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // Add player
  const addPlayer = () => {
    const positions = getPositionsForSport(sport)
    const sportOption = sportOptions.find((option) => option.id === sport)
    const newId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `player-extra-${Date.now()}-${players.length + 1}`
    setPlayers((prevPlayers) => [
      ...prevPlayers,
      {
        id: newId,
        userId: null,
        userName: "",
        number: sportOption?.hasNumbers ? prevPlayers.length + 1 : undefined,
        position: positions.length > 0 ? positions[prevPlayers.length % positions.length] : undefined,
      },
    ])
    setOpenPlayerId(newId)
  }

  // Remove player
  const removePlayer = (playerId: string) => {
    setPlayers((prevPlayers) => prevPlayers.filter((player) => player.id !== playerId))
    setOpenPlayerId((current) => (current === playerId ? null : current))
  }

  const clearPlayerSelection = (playerId: string) => {
    setPlayers((prevPlayers) =>
      prevPlayers.map((player) => (player.id === playerId ? { ...player, userId: null, userName: "" } : player)),
    )
    setOpenPlayerId((current) => (current === playerId ? null : current))
    setFormError(null)
  }

  const updatePlayerNumber = (playerId: string, value: string) => {
    setPlayers((prevPlayers) =>
      prevPlayers.map((player) => {
        if (player.id !== playerId) return player
        if (value === "") {
          return { ...player, number: "" }
        }
        const parsed = Number.parseInt(value, 10)
        if (Number.isNaN(parsed)) {
          return player
        }
        return { ...player, number: parsed }
      }),
    )
  }

  const updatePlayerPosition = (playerId: string, position: string) => {
    // For volleyball, check if trying to set another libero
    if (sport === "volleyball" && position === "Libero") {
      const existingLibero = players.find((p) => p.id !== playerId && p.position === "Libero")
      if (existingLibero) {
        setFormError("Only one player can be assigned as Libero. Please change the existing Libero's position first.")
        return
      }
    }
    
    setFormError(null)
    setPlayers((prevPlayers) =>
      prevPlayers.map((player) => (player.id === playerId ? { ...player, position } : player)),
    )
  }

  const handleSelectPlayer = (playerId: string, user: UserOption) => {
    setPlayers((prevPlayers) =>
      prevPlayers.map((player) =>
        player.id === playerId 
          ? { 
              ...player, 
              userId: user.id, 
              userName: user.fullName || user.username,
              profilePhoto: user.profilePhoto,
              phoneNumber: user.phoneNumber
            } 
          : player,
      ),
    )
    setFormError(null)
  }

  // Create team
  const createTeam = async () => {
    setFormError(null)

    if (!teamName.trim()) {
      setFormError("Please provide a team name.")
      return
    }

    if (!sport) {
      setFormError("Select a sport to continue.")
      return
    }

    const selectedPlayers = players.filter((player) => player.userId)

    if (selectedPlayers.length === 0) {
      setFormError("Add at least one player from existing users.")
      return
    }

    const uniqueIds = new Set(selectedPlayers.map((player) => player.userId))
    if (uniqueIds.size !== selectedPlayers.length) {
      setFormError("Each player can only join the team once.")
      return
    }

    // Volleyball-specific validation
    if (sport === "volleyball") {
      if (selectedPlayers.length < 7) {
        setFormError("Volleyball teams require exactly 7 players (6 on court + 1 libero).")
        return
      }
      
      const liberoCount = selectedPlayers.filter((player) => player.position === "Libero").length
      if (liberoCount !== 1) {
        setFormError("Volleyball teams must have exactly 1 Libero player.")
        return
      }
    }

    setIsCreating(true)

    try {
      // Check for duplicate team name in same sport
      const checkResponse = await fetch(
        `/api/teams/check-duplicate?name=${encodeURIComponent(teamName.trim())}&sport=${sport}`
      )
      const { exists } = await checkResponse.json()
      if (exists) {
        setFormError(`A team named "${teamName}" already exists in ${sport}`)
        setIsCreating(false)
        return
      }

      const response = await fetch("/api/teams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: teamName.trim(),
          sport,
          logo: teamLogo,
          players: selectedPlayers.map((player) => ({
            userId: player.userId,
            number: typeof player.number === "number" ? player.number : undefined,
            position: player.position,
          })),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create team")
      }

      const newTeam = await response.json()
      setCreatedTeam(newTeam)
    } catch (error) {
      console.error("Error creating team:", error)
      setFormError(error instanceof Error ? error.message : "Failed to create team")
    } finally {
      setIsCreating(false)
    }
  }

  // Update team
  const updateTeam = async () => {
    setFormError(null)

    if (!teamName.trim()) {
      setFormError("Please provide a team name.")
      return
    }

    if (!sport) {
      setFormError("Select a sport to continue.")
      return
    }

    const selectedPlayers = players.filter((player) => player.userId)

    if (selectedPlayers.length === 0) {
      setFormError("Add at least one player from existing users.")
      return
    }

    const uniqueIds = new Set(selectedPlayers.map((player) => player.userId))
    if (uniqueIds.size !== selectedPlayers.length) {
      setFormError("Each player can only join the team once.")
      return
    }

    setIsCreating(true)

    try {
      // Check for duplicate team name in same sport (excluding current team)
      const checkResponse = await fetch(
        `/api/teams/check-duplicate?name=${encodeURIComponent(teamName.trim())}&sport=${sport}&excludeId=${editTeamId}`
      )
      const { exists } = await checkResponse.json()
      if (exists) {
        setFormError(`A team named "${teamName}" already exists in ${sport}`)
        setIsCreating(false)
        return
      }

      const response = await fetch(`/api/teams/${editTeamId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: teamName.trim(),
          sport,
          logo: teamLogo,
          players: selectedPlayers.map((player) => ({
            userId: player.userId,
            number: typeof player.number === "number" ? player.number : undefined,
            position: player.position,
          })),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update team")
      }

      const updatedTeam = await response.json()
      setCreatedTeam(updatedTeam)
    } catch (error) {
      console.error("Error updating team:", error)
      setFormError(error instanceof Error ? error.message : "Failed to update team")
    } finally {
      setIsCreating(false)
    }
  }

  // Get sport option
  const sportOption = sportOptions.find((option) => option.id === sport)
  const positionsForSport = getPositionsForSport(sport)
  const selectedPlayersCount = players.filter((player) => player.userId).length
  const selectedUserIds = players
    .filter((player): player is PlayerFormEntry & { userId: string } => Boolean(player.userId))
    .map((player) => player.userId)
  const allUsersSelected = userOptions.length > 0 && selectedPlayersCount >= userOptions.length

  // Effect to redirect after team creation
  useEffect(() => {
    if (createdTeam) {
      const timer = setTimeout(() => {
        router.push("/teams")
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [createdTeam, router])

  // Handle manual player creation
  const handleManualPlayerSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreatingManualPlayer(true)
    setFormError(null)

    try {
      // Validate required fields
      if (!manualPlayerData.username || !manualPlayerData.full_name || !manualPlayerData.email || !manualPlayerData.password) {
        setFormError("Username, name, email, and password are required")
        setIsCreatingManualPlayer(false)
        return
      }

      // Generate a default password if not provided (for team creation context)
      const password = manualPlayerData.password || `temp${Date.now()}`

      // Create user
      const response = await fetch("/api/users/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          users: [{
            username: manualPlayerData.username,
            full_name: manualPlayerData.full_name,
            email: manualPlayerData.email,
            phone_number: manualPlayerData.phone_number || null,
            password: password,
            number: manualPlayerData.number ? parseInt(manualPlayerData.number) : undefined,
          }],
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create player")
      }

      const result = await response.json()
      const createdUser = result.users[0]

      // Refresh user list
      const usersResponse = await fetch("/api/users")
      if (usersResponse.ok) {
        const usersData = await usersResponse.json()
        setUserOptions(
          (usersData || []).map((user: any) => ({
            id: user.id,
            fullName: user.fullName || user.full_name || "",
            username: user.username,
            email: user.email,
          })),
        )
      }

      // Add player to team if sport is selected
      if (sport && createdUser) {
        const positions = getPositionsForSport(sport)
        const sportOption = sportOptions.find((option) => option.id === sport)
        const newId =
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `player-${Date.now()}-${players.length + 1}`
        
        setPlayers((prevPlayers) => [
          ...prevPlayers,
          {
            id: newId,
            userId: createdUser.id,
            userName: createdUser.fullName || createdUser.username,
            number: manualPlayerData.number ? parseInt(manualPlayerData.number) : (sportOption?.hasNumbers ? prevPlayers.length + 1 : undefined),
            position: positions.length > 0 ? positions[prevPlayers.length % positions.length] : undefined,
          },
        ])
        setActiveTab("players")
      }

      // Reset form and close dialog
      setManualPlayerData({
        username: "",
        full_name: "",
        email: "",
        phone_number: "",
        number: "",
        password: "",
      })
      setIsManualDialogOpen(false)
    } catch (error) {
      console.error("Error creating player:", error)
      setFormError(error instanceof Error ? error.message : "Failed to create player")
    } finally {
      setIsCreatingManualPlayer(false)
    }
  }

  // Handle CSV/Excel upload
  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setCsvFile(file)
    setIsCSVUploading(true)
    setFormError(null)

    try {
      // Detect file type
      const fileName = file.name.toLowerCase()
      const isExcel = fileName.endsWith(".xlsx") || fileName.endsWith(".xls")
      const isCSV = fileName.endsWith(".csv")

      if (!isExcel && !isCSV) {
        throw new Error("Please upload a CSV (.csv) or Excel (.xlsx, .xls) file")
      }

      let header: string[] = []
      let rows: string[][] = []

      if (isExcel) {
        // Parse Excel file
        const arrayBuffer = await file.arrayBuffer()
        const workbook = XLSX.read(arrayBuffer, { type: "array" })
        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" }) as string[][]
        
        if (data.length < 2) {
          throw new Error("Excel file must have at least a header row and one data row")
        }

        header = (data[0] || []).map((h: any) => String(h || "").trim())
        rows = data.slice(1).filter((row: string[]) => row.some((cell: string) => String(cell || "").trim() !== ""))
      } else {
        // Parse CSV file
        const text = await file.text()
        const lines = text.split("\n").filter((line) => line.trim())
        
        if (lines.length < 2) {
          throw new Error("CSV file must have at least a header row and one data row")
        }

        // Helper function to parse CSV line (handles quoted values)
        const parseCSVLine = (line: string): string[] => {
          const result: string[] = []
          let current = ""
          let inQuotes = false
          
          for (let i = 0; i < line.length; i++) {
            const char = line[i]
            if (char === '"') {
              inQuotes = !inQuotes
            } else if (char === "," && !inQuotes) {
              result.push(current.trim())
              current = ""
            } else {
              current += char
            }
          }
          result.push(current.trim())
          return result
        }

        header = parseCSVLine(lines[0]).map((h) => h.replace(/"/g, "").trim())
        rows = lines.slice(1).map((line) => parseCSVLine(line).map((v) => v.replace(/^"|"$/g, "").trim()))
      }

      // Helper function to normalize header for matching (removes all punctuation, spaces, and converts to lowercase)
      const normalizeHeader = (h: string): string => {
        return h.replace(/[_\s\-\.\:;,\/\\]/g, "").toLowerCase()
      }

      // Map headers with flexible matching (case-insensitive and handles various formats)
      const headerMap: Record<string, number> = {}
      const usedIndices = new Set<number>()
      
      // First pass: Match player name/full name column (to avoid conflicts with "name")
      header.forEach((h, index) => {
        const normalized = normalizeHeader(h)
        const originalLower = h.trim().toLowerCase()
        
        if (!headerMap["player name"]) {
          if (normalized === "playername" || normalized === "fullname" || normalized === "full_name" ||
              originalLower === "player name" || originalLower === "full name" ||
              (normalized.includes("player") && normalized.includes("name") && normalized !== "name") ||
              (normalized.includes("full") && normalized.includes("name") && normalized !== "name")) {
            headerMap["player name"] = index
            usedIndices.add(index)
          }
        }
      })
      
      // Second pass: Match username/name column - handles "name", "username", "user name"
      header.forEach((h, index) => {
        if (usedIndices.has(index)) return // Skip if already used for player name
        
        const normalized = normalizeHeader(h)
        const originalLower = h.trim().toLowerCase()
        
        if (!headerMap["name"]) {
          // Exact match for "name" or "username" (highest priority)
          if (normalized === "name" || normalized === "username" ||
              originalLower === "name" || originalLower === "username") {
            headerMap["name"] = index
            usedIndices.add(index)
          }
          // Match "user name" variations (but not if it's "player name" or "full name")
          else if ((normalized.includes("user") && normalized.includes("name")) && 
                   !normalized.includes("player") && !normalized.includes("full")) {
            headerMap["name"] = index
            usedIndices.add(index)
          }
        }
      })
      
      // Third pass: Match other columns
      header.forEach((h, index) => {
        const normalized = normalizeHeader(h)
        
        // Match email column
        if (!headerMap["email"] && normalized.includes("email")) {
          headerMap["email"] = index
        }
        
        // Match phone number column (handles "Phone No.", "Phone Number", "Mobile", etc.)
        if (!headerMap["phone number"] && (normalized.includes("phone") || normalized.includes("mobile") || normalized.includes("tel") || normalized.includes("contact"))) {
          headerMap["phone number"] = index
        }
        
        // Match number/jersey number column (handles "Number", "Jersey Number", "jersey number", etc.)
        // Only match if it's not already used for phone number
        if (!headerMap["number"] && headerMap["phone number"] !== index) {
          if (normalized === "number" || normalized.includes("jersey") || normalized === "jerseynumber") {
            headerMap["number"] = index
          }
        }
      })

      // Validate required headers
      const missingHeaders: string[] = []
      if (!headerMap["name"]) missingHeaders.push("name (username)")
      if (!headerMap["player name"]) missingHeaders.push("player name")
      if (!headerMap["email"]) missingHeaders.push("email")
      
      if (missingHeaders.length > 0) {
        const foundHeaders = header.map((h) => `"${h}"`).join(", ")
        throw new Error(
          `File is missing required columns: ${missingHeaders.join(", ")}. ` +
          `Found columns: ${foundHeaders || "none"}. ` +
          `Note: Column matching is case-insensitive and handles variations like "Phone No." and "Number". ` +
          `Required: name (username), player name, email. Optional: phone number, number (jersey number).`
        )
      }

      // Parse data rows
      const usersToCreate = []
      for (let i = 0; i < rows.length; i++) {
        const values = rows[i]
        const username = (String(values[headerMap["name"]] || "").trim())
        const fullName = (String(values[headerMap["player name"]] || "").trim())
        const email = (String(values[headerMap["email"]] || "").trim())
        const phoneNumber = (String(values[headerMap["phone number"]] || "").trim())
        const number = (String(values[headerMap["number"]] || "").trim())

        if (!username || !fullName || !email) {
          continue // Skip invalid rows
        }

        // Generate a default password
        const password = `temp${Date.now()}${i}`

        // Parse number, handling leading zeros and invalid values
        let parsedNumber: number | undefined = undefined
        if (number) {
          const num = parseInt(String(number), 10)
          if (!isNaN(num) && num > 0) {
            parsedNumber = num
          }
        }

        usersToCreate.push({
          username,
          full_name: fullName,
          email,
          phone_number: phoneNumber || null,
          password,
          number: parsedNumber,
        })
      }

      if (usersToCreate.length === 0) {
        throw new Error("No valid players found in file. Please ensure your file has at least one row with name, player name, and email.")
      }

      // Create users in bulk
      const response = await fetch("/api/users/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ users: usersToCreate }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create players from file")
      }

      const result = await response.json()
      const createdUsers = result.users || []

      // Refresh user list
      const usersResponse = await fetch("/api/users")
      if (usersResponse.ok) {
        const usersData = await usersResponse.json()
        setUserOptions(
          (usersData || []).map((user: any) => ({
            id: user.id,
            fullName: user.fullName || user.full_name || "",
            username: user.username,
            email: user.email,
          })),
        )
      }

      // Add players to team if sport is selected
      if (sport && createdUsers.length > 0) {
        const positions = getPositionsForSport(sport)
        const sportOption = sportOptions.find((option) => option.id === sport)
        
        const newPlayers: PlayerFormEntry[] = createdUsers.map((user: any, index: number) => {
          const newId =
            typeof crypto !== "undefined" && "randomUUID" in crypto
              ? crypto.randomUUID()
              : `player-${Date.now()}-${players.length + index + 1}`
          
          return {
            id: newId,
            userId: user.id,
            userName: user.fullName || user.username,
            number: user.number || (sportOption?.hasNumbers ? players.length + index + 1 : undefined),
            position: positions.length > 0 ? positions[(players.length + index) % positions.length] : undefined,
          }
        })

        setPlayers((prevPlayers) => [...prevPlayers, ...newPlayers])
        setActiveTab("players")
      }

      // Reset file input
      if (csvInputRef.current) {
        csvInputRef.current.value = ""
      }
      setCsvFile(null)
    } catch (error) {
      console.error("Error processing file:", error)
      setFormError(error instanceof Error ? error.message : "Failed to process CSV/Excel file")
    } finally {
      setIsCSVUploading(false)
    }
  }

  return (
    <PageTransition>
      <div className="container mx-auto px-4 py-8">
        {createdTeam ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md mx-auto bg-card p-8 rounded-lg shadow-lg text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <Save className="h-8 w-8 text-green-600" />
            </motion.div>
            <h2 className="text-2xl font-bold mb-2">{isEditMode ? "Team Updated!" : "Team Created!"}</h2>
            <p className="text-muted-foreground mb-6">Your team "{createdTeam.name}" has been successfully {isEditMode ? "updated" : "created"}.</p>
            <div className="flex justify-center">
              <Button asChild>
                <Link href="/teams">View All Teams</Link>
              </Button>
            </div>
          </motion.div>
        ) : (
          <Card className="w-full max-w-4xl mx-auto">
            <CardHeader>
              <div className="flex flex-col gap-2">
                <CardTitle className="text-2xl">{isEditMode ? "Edit Team" : "Create New Team"}</CardTitle>
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Rosters sync with existing user profiles so analytics stay reliable.
                </p>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs
                value={activeTab}
                onValueChange={(value) => setActiveTab(value as "details" | "players")}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2 mb-8">
                  <TabsTrigger value="details">Team Details</TabsTrigger>
                  <TabsTrigger value="players" disabled={!sport}>
                    Players
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="animate-slide-in">
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="teamName">Team Name</Label>
                        <Input
                          id="teamName"
                          value={teamName}
                          onChange={(e) => setTeamName(e.target.value)}
                          placeholder="Enter team name"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="sport">Sport</Label>
                        <Select value={sport} onValueChange={handleSportChange}>
                          <SelectTrigger id="sport">
                            <SelectValue placeholder="Select sport" />
                          </SelectTrigger>
                          <SelectContent>
                            {sportOptions.map((option) => (
                              <SelectItem key={option.id} value={option.id}>
                                {option.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Team Logo</Label>
                      <div className="flex items-center">
                        {teamLogo ? (
                          <div className="relative w-24 h-24 mr-4 border rounded">
                            <Image
                              src={teamLogo || "/placeholder.svg"}
                              alt={teamName || "Team logo"}
                              fill
                              className="object-contain"
                              sizes="96px"
                            />
                            <Button
                              variant="destructive"
                              size="icon"
                              className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                              onClick={removeLogo}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <label
                            htmlFor="logo-upload"
                            className="flex flex-col items-center justify-center w-24 h-24 border border-dashed rounded cursor-pointer hover:bg-muted transition-colors"
                          >
                            <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                            <span className="text-xs text-muted-foreground">Upload Logo</span>
                            <input
                              type="file"
                              id="logo-upload"
                              ref={fileInputRef}
                              className="hidden"
                              accept="image/*"
                              onChange={handleLogoUpload}
                            />
                          </label>
                        )}
                        <div className="ml-4">
                          <p className="text-sm text-muted-foreground">Upload your team logo (optional)</p>
                          <p className="text-xs text-muted-foreground mt-1">Recommended size: 200x200 pixels</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        onClick={() => {
                          setFormError(null)
                          setActiveTab("players")
                        }}
                        disabled={!sport || !teamName}
                      >
                        Next: Add Players
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="players" className="animate-slide-in">
                  <div className="space-y-6">
                    {(formError || usersError || (!usersLoading && !usersError && userOptions.length === 0)) && (
                      <div className="space-y-3">
                        {formError && (
                          <Alert variant="destructive">
                            <AlertDescription>{formError}</AlertDescription>
                          </Alert>
                        )}
                        {usersError && (
                          <Alert variant="destructive">
                            <AlertDescription>{usersError}</AlertDescription>
                          </Alert>
                        )}
                        {!usersLoading && !usersError && userOptions.length === 0 && (
                          <Alert>
                            <AlertDescription>
                              No registered users found. Add users first so you can assemble a team roster.
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    )}

                    {/* Player Addition Options */}
                    <div className="border rounded-lg p-4 bg-muted/30">
                      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold mb-1">Add Players to Team</h3>
                          <p className="text-sm text-muted-foreground">
                            Create new users or select from existing ones
                          </p>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <Button
                            variant="outline"
                            onClick={() => setIsManualDialogOpen(true)}
                            className="flex items-center gap-2"
                          >
                            <UserPlus className="h-4 w-4" />
                            Add Player Manually
                          </Button>
                          <div className="relative flex items-center">
                            <Button
                              variant="outline"
                              onClick={() => csvInputRef.current?.click()}
                              className="flex items-center gap-2"
                              disabled={isCSVUploading}
                            >
                              <FileText className="h-4 w-4" />
                              {isCSVUploading ? "Uploading..." : "Upload CSV/Excel"}
                            </Button>
                            <input
                              ref={csvInputRef}
                              type="file"
                              accept=".csv,.xlsx,.xls"
                              className="hidden"
                              onChange={handleCSVUpload}
                            />
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 ml-1">
                                  <span className="text-xs">?</span>
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-80">
                                <div className="space-y-2">
                                  <p className="font-semibold text-sm">CSV/Excel Format:</p>
                                  <p className="text-xs text-muted-foreground">
                                    Supports CSV (.csv) and Excel (.xlsx, .xls) files. Your file should have these columns (in any order, case-insensitive):
                                  </p>
                                  <ul className="text-xs text-muted-foreground list-disc list-inside space-y-1">
                                    <li><strong>name</strong> or <strong>username</strong> - Username (required)</li>
                                    <li><strong>player name</strong> or <strong>full name</strong> - Full name (required)</li>
                                    <li><strong>email</strong> - Email address (required)</li>
                                    <li><strong>phone number</strong>, <strong>Phone No.</strong>, or <strong>mobile</strong> - Phone number (optional)</li>
                                    <li><strong>number</strong>, <strong>Number</strong>, or <strong>jersey number</strong> - Jersey number (optional)</li>
                                  </ul>
                                  <p className="text-xs text-muted-foreground mt-2">
                                    <strong>Note:</strong> Column names are matched case-insensitively. All variations are automatically recognized (e.g., "name" = "username", "player name" = "full name", "Number" = "jersey number").
                                  </p>
                                  <div className="mt-3 p-2 bg-muted rounded text-xs font-mono">
                                    name,player name,email,Phone No.,Number<br/>
                                    john_doe,John Doe,john@example.com,+1234567890,10<br/>
                                    jane_smith,Jane Smith,jane@example.com,,5
                                  </div>
                                </div>
                              </PopoverContent>
                            </Popover>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold">
                        Players ({selectedPlayersCount} selected)
                      </h3>
                      <Button variant="outline" onClick={addPlayer} className="flex items-center" disabled={allUsersSelected}>
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Add Player from Existing
                      </Button>
                    </div>
                    {allUsersSelected && (
                      <p className="text-xs text-muted-foreground">
                        Every available user has been assigned. Create new users to add more teammates.
                      </p>
                    )}

                    <div className="space-y-4">
                      {players.map((player, index) => (
                        <motion.div
                          key={player.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          className="p-4 border rounded-lg bg-card"
                        >
                          <div className="flex items-center mb-3">
                            {player.profilePhoto ? (
                              <Image
                                src={player.profilePhoto}
                                alt={player.userName || `Player ${index + 1}`}
                                width={40}
                                height={40}
                                className="rounded-full object-cover mr-3"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mr-3">
                                <User className="h-5 w-5 text-primary" />
                              </div>
                            )}
                            <div className="font-medium">
                              {player.userName || `Player ${index + 1}`}
                              {player.phoneNumber && (
                                <span className="text-xs text-muted-foreground ml-2">• {player.phoneNumber}</span>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="ml-auto"
                              onClick={() => removePlayer(player.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1">
                              <Label>Member</Label>
                              <Popover
                                open={!usersError && openPlayerId === player.id}
                                onOpenChange={(open) => {
                                  if (usersError) return
                                  setOpenPlayerId(open ? player.id : null)
                                }}
                              >
                                <PopoverTrigger asChild>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    role="combobox"
                                    disabled={usersLoading || Boolean(usersError)}
                                    className={cn(
                                      "w-full justify-between text-left font-normal",
                                      !player.userId && "text-muted-foreground",
                                    )}
                                  >
                                    <span className="truncate">
                                      {player.userId
                                        ? player.userName
                                        : usersLoading
                                          ? "Loading roster..."
                                          : allUsersSelected
                                            ? "All users assigned"
                                            : "Select registered player"}
                                    </span>
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                  </Button>
                                </PopoverTrigger>
                                {!usersError && (
                                  <PopoverContent className="p-0 w-[320px]" align="start">
                                    <Command>
                                      <CommandInput placeholder="Search players..." />
                                      <CommandList>
                                        {usersLoading ? (
                                          <div className="flex items-center gap-2 px-3 py-4 text-sm text-muted-foreground">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Syncing roster...
                                          </div>
                                        ) : (
                                          <>
                                            <CommandEmpty>No users match that search.</CommandEmpty>
                                            <CommandGroup heading="Available players">
                                              {userOptions.map((user) => {
                                                const isSelectedElsewhere =
                                                  selectedUserIds.includes(user.id) && player.userId !== user.id
                                                const isCurrent = player.userId === user.id
                                                return (
                                                  <CommandItem
                                                    key={user.id}
                                                    value={`${user.fullName || user.username} ${user.email}`}
                                                    disabled={isSelectedElsewhere}
                                                    onSelect={() => {
                                                      handleSelectPlayer(player.id, user)
                                                      setOpenPlayerId(null)
                                                    }}
                                                  >
                                                    <div className="flex items-center gap-2 w-full">
                                                      {user.profilePhoto ? (
                                                        <Image
                                                          src={user.profilePhoto}
                                                          alt={user.fullName || user.username}
                                                          width={32}
                                                          height={32}
                                                          className="rounded-full object-cover"
                                                        />
                                                      ) : (
                                                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                                                          <User className="h-4 w-4" />
                                                        </div>
                                                      )}
                                                      <div className="flex flex-col flex-1">
                                                        <span className="font-medium">
                                                          {user.fullName || user.username}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground">
                                                          @{user.username}
                                                          {user.phoneNumber && ` • ${user.phoneNumber}`}
                                                        </span>
                                                      </div>
                                                      {isCurrent && <Check className="ml-auto h-4 w-4" />}
                                                    </div>
                                                  </CommandItem>
                                                )
                                              })}
                                            </CommandGroup>
                                          </>
                                        )}
                                      </CommandList>
                                    </Command>
                                  </PopoverContent>
                                )}
                              </Popover>
                              {player.userId ? (
                                <div className="flex items-center justify-between rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
                                  <span className="truncate">
                                    {player.userName}
                                    {(() => {
                                      const detail = userOptions.find((user) => user.id === player.userId)
                                      return detail ? ` • ${detail.email}` : ""
                                    })()}
                                  </span>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2"
                                    onClick={() => clearPlayerSelection(player.id)}
                                  >
                                    Clear
                                  </Button>
                                </div>
                              ) : (
                                <p className="text-xs text-muted-foreground">
                                  {usersLoading
                                    ? "Fetching players from directory..."
                                    : usersError
                                      ? "Unable to load players right now."
                                      : "Only registered users can join a team."}
                                </p>
                              )}
                            </div>

                            {sportOption?.hasNumbers && (
                              <div className="space-y-1">
                                <Label htmlFor={`player-number-${player.id}`}>Number</Label>
                                <Input
                                  id={`player-number-${player.id}`}
                                  type="number"
                                  value={player.number ?? ""}
                                  onChange={(e) => updatePlayerNumber(player.id, e.target.value)}
                                  placeholder="Jersey number"
                                />
                              </div>
                            )}

                            {positionsForSport.length > 0 && (
                              <div className="space-y-1">
                                <Label htmlFor={`player-position-${player.id}`}>Position</Label>
                                <Select
                                  value={player.position || ""}
                                  onValueChange={(value) => updatePlayerPosition(player.id, value)}
                                >
                                  <SelectTrigger id={`player-position-${player.id}`}>
                                    <SelectValue placeholder="Select position" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {positionsForSport.map((position) => (
                                      <SelectItem key={position} value={position}>
                                        {position}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    <div className="flex justify-between">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setFormError(null)
                          setActiveTab("details")
                        }}
                      >
                        Back to Details
                      </Button>
                      <Button
                        onClick={isEditMode ? updateTeam : createTeam}
                        disabled={
                          selectedPlayersCount === 0 || isCreating || !teamName || !sport
                        }
                        className="relative"
                      >
                        {isCreating ? (
                          <>
                            <span className="opacity-0">{isEditMode ? "Update Team" : "Create Team"}</span>
                            <span className="absolute inset-0 flex items-center justify-center">
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                              >
                                <PlusCircle className="h-4 w-4" />
                              </motion.div>
                            </span>
                          </>
                        ) : (
                          <>{isEditMode ? "Update Team" : "Create Team"}</>
                        )}
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}

        {/* Manual Player Creation Dialog */}
        <Dialog open={isManualDialogOpen} onOpenChange={setIsManualDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Player Manually</DialogTitle>
              <DialogDescription>
                Create a new user account and add them to the team roster.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleManualPlayerSubmit} className="space-y-4">
              {formError && (
                <Alert variant="destructive">
                  <AlertDescription>{formError}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="manual-username">Username *</Label>
                <Input
                  id="manual-username"
                  value={manualPlayerData.username}
                  onChange={(e) => setManualPlayerData({ ...manualPlayerData, username: e.target.value })}
                  placeholder="Enter username"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="manual-full-name">Player Name *</Label>
                <Input
                  id="manual-full-name"
                  value={manualPlayerData.full_name}
                  onChange={(e) => setManualPlayerData({ ...manualPlayerData, full_name: e.target.value })}
                  placeholder="Enter full name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="manual-email">Email *</Label>
                <Input
                  id="manual-email"
                  type="email"
                  value={manualPlayerData.email}
                  onChange={(e) => setManualPlayerData({ ...manualPlayerData, email: e.target.value })}
                  placeholder="Enter email"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="manual-phone">Phone Number</Label>
                <Input
                  id="manual-phone"
                  type="tel"
                  value={manualPlayerData.phone_number}
                  onChange={(e) => setManualPlayerData({ ...manualPlayerData, phone_number: e.target.value })}
                  placeholder="Enter phone number (optional)"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="manual-number">Jersey Number</Label>
                <Input
                  id="manual-number"
                  type="number"
                  value={manualPlayerData.number}
                  onChange={(e) => setManualPlayerData({ ...manualPlayerData, number: e.target.value })}
                  placeholder="Enter jersey number (optional)"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="manual-password">Password *</Label>
                <Input
                  id="manual-password"
                  type="password"
                  value={manualPlayerData.password}
                  onChange={(e) => setManualPlayerData({ ...manualPlayerData, password: e.target.value })}
                  placeholder="Enter password (min 6 characters)"
                  required
                  minLength={6}
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsManualDialogOpen(false)
                    setManualPlayerData({
                      username: "",
                      full_name: "",
                      email: "",
                      phone_number: "",
                      number: "",
                      password: "",
                    })
                    setFormError(null)
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isCreatingManualPlayer}>
                  {isCreatingManualPlayer ? "Creating..." : "Create Player"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </PageTransition>
  )
}
