import { Client } from "pg"

// In-memory map of matchId -> Set of callbacks
const subscribers = new Map<string, Set<(data: any) => void>>()

// Single Postgres LISTEN connection
let listenClient: Client | null = null
let isListening = false

/**
 * Initialize the Postgres LISTEN connection
 */
async function initializeListenConnection() {
  if (isListening && listenClient) {
    return
  }

  try {
    // Create a dedicated client for LISTEN (separate from the pool)
    listenClient = new Client({
      host: process.env.PGHOST || "localhost",
      port: Number.parseInt(process.env.PGPORT || "5432"),
      database: process.env.PGDATABASE || "sports_scoring_db",
      user: process.env.PGUSER || "postgres",
      password: process.env.PGPASSWORD || "postgres",
      ssl: false,
    })

    await listenClient.connect()

    // Set up notification handler
    listenClient.on("notification", (msg) => {
      if (msg.channel === "score_updates" && msg.payload) {
        try {
          const data = JSON.parse(msg.payload)
          const matchId = data.matchId

          // Forward to all subscribers for this match
          const matchSubscribers = subscribers.get(matchId)
          if (matchSubscribers) {
            matchSubscribers.forEach((callback) => {
              try {
                callback(data)
              } catch (error) {
                console.error(`Error in subscriber callback for match ${matchId}:`, error)
              }
            })
          }
        } catch (error) {
          console.error("Error parsing notification payload:", error)
        }
      }
    })

    // Handle connection errors
    listenClient.on("error", (error) => {
      console.error("Postgres LISTEN connection error:", error)
      isListening = false
      // Attempt to reconnect after a delay
      setTimeout(() => {
        if (!isListening) {
          initializeListenConnection().catch(console.error)
        }
      }, 5000)
    })

    // Start listening
    await listenClient.query("LISTEN score_updates")
    isListening = true
    console.log("Postgres LISTEN connection established for score_updates")
  } catch (error) {
    console.error("Error initializing LISTEN connection:", error)
    isListening = false
    listenClient = null
    throw error
  }
}

/**
 * Subscribe to score updates for a specific match
 * @param matchId - The match ID to subscribe to
 * @param callback - Callback function that receives update data
 * @returns Unsubscribe function
 */
export async function subscribeToScoreUpdates(
  matchId: string,
  callback: (data: { matchId: string; score: any; status: string; version: number; updatedAt: string }) => void
): Promise<() => void> {
  // Ensure LISTEN connection is established
  await initializeListenConnection()

  // Add callback to subscribers map
  if (!subscribers.has(matchId)) {
    subscribers.set(matchId, new Set())
  }
  subscribers.get(matchId)!.add(callback)

  // Return unsubscribe function
  return () => {
    const matchSubscribers = subscribers.get(matchId)
    if (matchSubscribers) {
      matchSubscribers.delete(callback)
      // Clean up empty sets
      if (matchSubscribers.size === 0) {
        subscribers.delete(matchId)
      }
    }
  }
}

/**
 * Unsubscribe from score updates for a specific match
 * @param matchId - The match ID to unsubscribe from
 * @param callback - The callback function to remove
 */
export function unsubscribeFromScoreUpdates(matchId: string, callback: (data: any) => void): void {
  const matchSubscribers = subscribers.get(matchId)
  if (matchSubscribers) {
    matchSubscribers.delete(callback)
    // Clean up empty sets
    if (matchSubscribers.size === 0) {
      subscribers.delete(matchId)
    }
  }
}

/**
 * Cleanup function to close the LISTEN connection
 * Should be called on application shutdown
 */
export async function cleanupScoreEvents(): Promise<void> {
  if (listenClient) {
    try {
      await listenClient.query("UNLISTEN score_updates")
      await listenClient.end()
      console.log("Postgres LISTEN connection closed")
    } catch (error) {
      console.error("Error closing LISTEN connection:", error)
    } finally {
      listenClient = null
      isListening = false
    }
  }
}

