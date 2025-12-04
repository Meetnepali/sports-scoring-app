"use client"

import Link from "next/link"
import type React from "react"
import { useState, useRef, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
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
import { PlusCircle, Trash2, Upload, User, X, Save, ChevronsUpDown, Check, Loader2, Sparkles, FileText, UserPlus, ArrowLeft, Phone, Image as ImageIcon } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import Image from "next/image"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

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

export default function EditTeamPage() {
  const router = useRouter()
  const params = useParams()
  const teamId = params?.id as string
  
  const [isLoadingTeam, setIsLoadingTeam] = useState(true)
  const [sport, setSport] = useState("")
  const [teamName, setTeamName] = useState("")
  const [players, setPlayers] = useState<PlayerFormEntry[]>([])
  const [teamLogo, setTeamLogo] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [savedTeam, setSavedTeam] = useState<any>(null)
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
    profile_photo: "",
    number: "",
    password: "",
  })
  const [isCreatingManualPlayer, setIsCreatingManualPlayer] = useState(false)

  // Fetch users
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

  // Fetch team data
  useEffect(() => {
    if (teamId) {
      setIsLoadingTeam(true)
      fetch(`/api/teams/${teamId}`)
        .then(res => {
          if (!res.ok) throw new Error('Failed to load team')
          return res.json()
        })
        .then(team => {
          setSport(team.sport)
          setTeamName(team.name)
          setTeamLogo(team.logo)
          
          // Map players with all their data
          const teamPlayers = team.players.map((p: any) => ({
            id: crypto.randomUUID(),
            userId: p.userId,
            userName: p.name,
            number: p.number || "",
            position: p.position || "",
            phoneNumber: p.phoneNumber || "",
            profilePhoto: p.profilePhoto || "",
          }))
          setPlayers(teamPlayers)
        })
        .catch(err => {
          setFormError('Failed to load team data')
          console.error(err)
        })
        .finally(() => setIsLoadingTeam(false))
    }
  }, [teamId])

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
      default:
        return []
    }
  }

  const selectedSport = sportOptions.find((opt) => opt.id === sport)
  const positions = getPositionsForSport(sport)

  // Logo upload
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

  const removeLogo = () => {
    setTeamLogo(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // Player management
  const addPlayer = () => {
    setPlayers([
      ...players,
      {
        id: crypto.randomUUID(),
        userId: null,
        userName: "",
        number: "",
        position: "",
        phoneNumber: "",
        profilePhoto: "",
      },
    ])
  }

  const removePlayer = (playerId: string) => {
    setPlayers(players.filter((p) => p.id !== playerId))
    if (openPlayerId === playerId) {
      setOpenPlayerId(null)
    }
  }

  const handleSelectPlayer = (playerId: string, selectedUserId: string) => {
    const user = userOptions.find((u) => u.id === selectedUserId)
    if (!user) return

    setPlayers(
      players.map((player) =>
        player.id === playerId
          ? {
              ...player,
              userId: user.id,
              userName: user.fullName || user.username,
              phoneNumber: player.phoneNumber || user.phoneNumber || "",
              profilePhoto: player.profilePhoto || user.profilePhoto || "",
            }
          : player,
      ),
    )
    setOpenPlayerId(null)
  }

  const updatePlayerField = (playerId: string, field: string, value: any) => {
    // For volleyball, check if trying to set another libero
    if (sport === "volleyball" && field === "position" && value === "Libero") {
      const existingLibero = players.find((p) => p.id !== playerId && p.position === "Libero")
      if (existingLibero) {
        setFormError("Only one player can be assigned as Libero. Please change the existing Libero's position first.")
        return
      }
    }
    
    setFormError(null)
    setPlayers(
      players.map((player) =>
        player.id === playerId ? { ...player, [field]: value } : player,
      ),
    )
  }

  // CSV Upload
  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setCsvFile(file)
    setIsCSVUploading(true)

    try {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data)
      const worksheet = workbook.Sheets[workbook.SheetNames[0]]
      const jsonData = XLSX.utils.sheet_to_json(worksheet)

      const newPlayers: PlayerFormEntry[] = []
      for (const row of jsonData) {
        const email = (row as any).Email || (row as any).email
        const user = userOptions.find((u) => u.email === email)

        if (user) {
          newPlayers.push({
            id: crypto.randomUUID(),
            userId: user.id,
            userName: user.fullName || user.username,
            number: (row as any).Number || (row as any).number || "",
            position: (row as any).Position || (row as any).position || "",
            phoneNumber: (row as any).Phone || (row as any).phone || user.phoneNumber || "",
            profilePhoto: user.profilePhoto || "",
          })
        }
      }

      setPlayers([...players, ...newPlayers])
      setCsvFile(null)
      if (csvInputRef.current) {
        csvInputRef.current.value = ""
      }
    } catch (error) {
      console.error("Error parsing CSV:", error)
      setFormError("Failed to parse CSV file")
    } finally {
      setIsCSVUploading(false)
    }
  }

  // Manual player creation
  const handleCreateManualPlayer = async () => {
    setFormError(null)
    
    if (!manualPlayerData.username || !manualPlayerData.email || !manualPlayerData.full_name || !manualPlayerData.password) {
      setFormError("Please fill in all required fields for the new player")
      return
    }

    setIsCreatingManualPlayer(true)

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: manualPlayerData.username,
          email: manualPlayerData.email,
          fullName: manualPlayerData.full_name,
          phoneNumber: manualPlayerData.phone_number,
          profilePhoto: manualPlayerData.profile_photo,
          password: manualPlayerData.password,
          role: "user",
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create player")
      }

      const newUser = await response.json()

      // Add to user options
      const newUserOption: UserOption = {
        id: newUser.user.id,
        fullName: newUser.user.fullName || manualPlayerData.full_name,
        username: newUser.user.username,
        email: newUser.user.email,
        phoneNumber: manualPlayerData.phone_number,
        profilePhoto: manualPlayerData.profile_photo,
      }
      setUserOptions([...userOptions, newUserOption])

      // Add to team players
      setPlayers([
        ...players,
        {
          id: crypto.randomUUID(),
          userId: newUserOption.id,
          userName: newUserOption.fullName,
          number: manualPlayerData.number ? parseInt(manualPlayerData.number) : "",
          position: "",
          phoneNumber: manualPlayerData.phone_number,
          profilePhoto: manualPlayerData.profile_photo,
        },
      ])

      // Reset form
      setManualPlayerData({
        username: "",
        full_name: "",
        email: "",
        phone_number: "",
        profile_photo: "",
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

  // Save team
  const saveTeam = async () => {
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

    setIsSaving(true)

    try {
      const response = await fetch(`/api/teams/${teamId}`, {
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
            phoneNumber: player.phoneNumber,
            profilePhoto: player.profilePhoto,
          })),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update team")
      }

      const updatedTeam = await response.json()
      setSavedTeam(updatedTeam)
    } catch (error) {
      console.error("Error updating team:", error)
      setFormError(error instanceof Error ? error.message : "Failed to update team")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoadingTeam) {
    return (
      <PageTransition>
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"
              />
              <p className="text-muted-foreground">Loading team...</p>
            </div>
          </div>
        </div>
      </PageTransition>
    )
  }

  if (savedTeam) {
    return (
      <PageTransition>
        <div className="container mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md mx-auto text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <Check className="h-10 w-10 text-green-600" />
            </motion.div>
            <h2 className="text-3xl font-bold mb-4">Team Updated!</h2>
            <p className="text-muted-foreground mb-8">
              {savedTeam.name} has been successfully updated with {savedTeam.players.length} players.
            </p>
            <div className="flex gap-4 justify-center">
              <Button asChild variant="outline">
                <Link href="/teams">View All Teams</Link>
              </Button>
              <Button asChild>
                <Link href={`/sports/${savedTeam.sport}/teams/${savedTeam.id}`}>View Team</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <Link href="/teams">
            <Button variant="outline" size="icon" className="mr-4">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Edit Team</h1>
        </div>

        <Card className="w-full max-w-4xl mx-auto">
          <CardHeader>
            <div className="flex flex-col gap-2">
              <CardTitle className="text-2xl">Update Team Details</CardTitle>
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="h-4 w-4 text-primary" />
                Rosters sync with existing user profiles so analytics stay reliable.
              </p>
            </div>
          </CardHeader>
          <CardContent>
            {formError && (
              <Alert variant="destructive" className="mb-6">
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}

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
                  <div className="space-y-2">
                    <Label htmlFor="teamName">Team Name *</Label>
                    <Input
                      id="teamName"
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      placeholder="Enter team name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sport">Sport *</Label>
                    <Select value={sport} onValueChange={setSport}>
                      <SelectTrigger id="sport">
                        <SelectValue placeholder="Select a sport" />
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

                  <div className="space-y-2">
                    <Label>Team Logo (optional)</Label>
                    <div className="flex items-start gap-4">
                      {teamLogo ? (
                        <div className="relative w-24 h-24 border rounded">
                          <Image
                            src={teamLogo}
                            alt={teamName || "Team logo"}
                            fill
                            className="object-contain rounded"
                            sizes="96px"
                          />
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                            onClick={removeLogo}
                            type="button"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <label
                          htmlFor="logo-upload"
                          className="flex flex-col items-center justify-center w-24 h-24 border border-dashed rounded cursor-pointer hover:bg-muted transition-colors"
                        >
                          <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                          <span className="text-xs text-muted-foreground">Upload</span>
                        </label>
                      )}
                      <input
                        type="file"
                        id="logo-upload"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleLogoUpload}
                      />
                      <div>
                        <p className="text-sm text-muted-foreground">Upload your team logo</p>
                        <p className="text-xs text-muted-foreground mt-1">Recommended: 200x200 pixels</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={() => setActiveTab("players")} disabled={!sport}>
                      Next: Edit Players
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="players" className="animate-slide-in">
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">
                      Team Roster ({players.filter((p) => p.userId).length})
                    </h3>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsManualDialogOpen(true)}
                        className="flex items-center"
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Create New Player
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => csvInputRef.current?.click()}
                        disabled={isCSVUploading}
                        className="flex items-center"
                      >
                        {isCSVUploading ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <FileText className="h-4 w-4 mr-2" />
                        )}
                        Import CSV
                      </Button>
                      <input
                        type="file"
                        ref={csvInputRef}
                        className="hidden"
                        accept=".csv,.xlsx,.xls"
                        onChange={handleCSVUpload}
                      />
                      <Button onClick={addPlayer} className="flex items-center">
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Add Player
                      </Button>
                    </div>
                  </div>

                  {usersLoading && (
                    <div className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                      <p className="text-muted-foreground">Loading users...</p>
                    </div>
                  )}

                  {usersError && (
                    <Alert variant="destructive">
                      <AlertDescription>{usersError}</AlertDescription>
                    </Alert>
                  )}

                  {!usersLoading && !usersError && (
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
                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mr-3">
                              {player.profilePhoto ? (
                                <Image
                                  src={player.profilePhoto}
                                  alt={player.userName}
                                  width={40}
                                  height={40}
                                  className="rounded-full object-cover"
                                />
                              ) : (
                                <User className="h-5 w-5 text-primary" />
                              )}
                            </div>
                            <div className="font-medium">Player {index + 1}</div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="ml-auto"
                              onClick={() => removePlayer(player.id)}
                              type="button"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <Label>Select User *</Label>
                              <Popover
                                open={openPlayerId === player.id}
                                onOpenChange={(open) => setOpenPlayerId(open ? player.id : null)}
                              >
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    role="combobox"
                                    className="w-full justify-between"
                                  >
                                    {player.userId
                                      ? userOptions.find((u) => u.id === player.userId)?.fullName ||
                                        player.userName
                                      : "Select user..."}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[300px] p-0">
                                  <Command>
                                    <CommandInput placeholder="Search users..." />
                                    <CommandEmpty>No user found.</CommandEmpty>
                                    <CommandList>
                                      <CommandGroup>
                                        {userOptions.map((user) => (
                                          <CommandItem
                                            key={user.id}
                                            value={user.fullName + user.email}
                                            onSelect={() => handleSelectPlayer(player.id, user.id)}
                                          >
                                            <Check
                                              className={cn(
                                                "mr-2 h-4 w-4",
                                                player.userId === user.id ? "opacity-100" : "opacity-0",
                                              )}
                                            />
                                            <div className="flex items-center gap-2">
                                              {user.profilePhoto && (
                                                <Image
                                                  src={user.profilePhoto}
                                                  alt={user.fullName}
                                                  width={24}
                                                  height={24}
                                                  className="rounded-full"
                                                />
                                              )}
                                              <div>
                                                <div>{user.fullName}</div>
                                                <div className="text-xs text-muted-foreground">{user.email}</div>
                                              </div>
                                            </div>
                                          </CommandItem>
                                        ))}
                                      </CommandGroup>
                                    </CommandList>
                                  </Command>
                                </PopoverContent>
                              </Popover>
                            </div>

                            {selectedSport?.hasNumbers && (
                              <div className="space-y-1">
                                <Label>Jersey Number</Label>
                                <Input
                                  type="number"
                                  value={player.number}
                                  onChange={(e) =>
                                    updatePlayerField(
                                      player.id,
                                      "number",
                                      e.target.value ? parseInt(e.target.value) : "",
                                    )
                                  }
                                  placeholder="Number"
                                />
                              </div>
                            )}

                            {selectedSport?.hasPositions && positions.length > 0 && (
                              <div className="space-y-1">
                                <Label>Position</Label>
                                <Select
                                  value={player.position}
                                  onValueChange={(value) => updatePlayerField(player.id, "position", value)}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select position" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {positions.map((pos) => (
                                      <SelectItem key={pos} value={pos}>
                                        {pos}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}

                            <div className="space-y-1">
                              <Label className="flex items-center gap-2">
                                <Phone className="h-3 w-3" />
                                Phone Number
                              </Label>
                              <Input
                                type="tel"
                                value={player.phoneNumber}
                                onChange={(e) => updatePlayerField(player.id, "phoneNumber", e.target.value)}
                                placeholder="Phone number"
                              />
                            </div>

                            <div className="space-y-1">
                              <Label className="flex items-center gap-2">
                                <ImageIcon className="h-3 w-3" />
                                Profile Photo URL
                              </Label>
                              <Input
                                type="url"
                                value={player.profilePhoto}
                                onChange={(e) => updatePlayerField(player.id, "profilePhoto", e.target.value)}
                                placeholder="https://example.com/photo.jpg"
                              />
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setActiveTab("details")}>
                      Back to Details
                    </Button>
                    <Button
                      onClick={saveTeam}
                      disabled={isSaving || players.filter((p) => p.userId).length === 0 || !teamName.trim()}
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Manual Player Creation Dialog */}
        <Dialog open={isManualDialogOpen} onOpenChange={setIsManualDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Player</DialogTitle>
              <DialogDescription>
                Add a new user to the system and automatically add them to this team.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="manual-username">Username *</Label>
                <Input
                  id="manual-username"
                  value={manualPlayerData.username}
                  onChange={(e) =>
                    setManualPlayerData({ ...manualPlayerData, username: e.target.value })
                  }
                  placeholder="username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="manual-fullname">Full Name *</Label>
                <Input
                  id="manual-fullname"
                  value={manualPlayerData.full_name}
                  onChange={(e) =>
                    setManualPlayerData({ ...manualPlayerData, full_name: e.target.value })
                  }
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="manual-email">Email *</Label>
                <Input
                  id="manual-email"
                  type="email"
                  value={manualPlayerData.email}
                  onChange={(e) =>
                    setManualPlayerData({ ...manualPlayerData, email: e.target.value })
                  }
                  placeholder="john@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="manual-phone">Phone Number</Label>
                <Input
                  id="manual-phone"
                  type="tel"
                  value={manualPlayerData.phone_number}
                  onChange={(e) =>
                    setManualPlayerData({ ...manualPlayerData, phone_number: e.target.value })
                  }
                  placeholder="+1234567890"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="manual-photo">Profile Photo URL</Label>
                <Input
                  id="manual-photo"
                  type="url"
                  value={manualPlayerData.profile_photo}
                  onChange={(e) =>
                    setManualPlayerData({ ...manualPlayerData, profile_photo: e.target.value })
                  }
                  placeholder="https://example.com/photo.jpg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="manual-number">Jersey Number</Label>
                <Input
                  id="manual-number"
                  type="number"
                  value={manualPlayerData.number}
                  onChange={(e) =>
                    setManualPlayerData({ ...manualPlayerData, number: e.target.value })
                  }
                  placeholder="10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="manual-password">Password *</Label>
                <Input
                  id="manual-password"
                  type="password"
                  value={manualPlayerData.password}
                  onChange={(e) =>
                    setManualPlayerData({ ...manualPlayerData, password: e.target.value })
                  }
                  placeholder="••••••••"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsManualDialogOpen(false)}
                disabled={isCreatingManualPlayer}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateManualPlayer} disabled={isCreatingManualPlayer}>
                {isCreatingManualPlayer ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Player"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PageTransition>
  )
}
