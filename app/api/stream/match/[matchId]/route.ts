import { NextRequest } from "next/server"
import { subscribeToScoreUpdates } from "@/lib/scoreEvents"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const { matchId } = await params

    if (!matchId) {
      return new Response("Match ID is required", { status: 400 })
    }

    // Create a ReadableStream for SSE
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()
        let unsubscribe: (() => void) | null = null
        let keepAliveInterval: NodeJS.Timeout | null = null
        let isClosed = false

        // Send initial connection message
        const sendMessage = (data: string) => {
          if (!isClosed) {
            controller.enqueue(encoder.encode(data))
          }
        }

        // Send keep-alive comment every 25 seconds
        keepAliveInterval = setInterval(() => {
          if (!isClosed) {
            sendMessage(": keep-alive\n\n")
          }
        }, 25000)

        // Subscribe to score updates
        try {
          unsubscribe = await subscribeToScoreUpdates(matchId, (updateData) => {
            if (!isClosed) {
              // Send SSE message with update data
              const message = `data: ${JSON.stringify(updateData)}\n\n`
              sendMessage(message)
            }
          })
        } catch (error) {
          console.error("Error subscribing to score updates:", error)
          sendMessage(`event: error\ndata: ${JSON.stringify({ error: "Failed to subscribe to updates" })}\n\n`)
          controller.close()
          return
        }

        // Handle client disconnect
        request.signal.addEventListener("abort", () => {
          isClosed = true
          if (keepAliveInterval) {
            clearInterval(keepAliveInterval)
          }
          if (unsubscribe) {
            unsubscribe()
          }
          controller.close()
        })
      },
    })

    // Return SSE response
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no", // Disable buffering in nginx
      },
    })
  } catch (error) {
    console.error("Error in SSE stream:", error)
    return new Response("Internal server error", { status: 500 })
  }
}

