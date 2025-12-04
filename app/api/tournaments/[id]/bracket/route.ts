import { type NextRequest, NextResponse } from "next/server"
import { 
  createBracketNode, 
  getTournamentBracketNodes, 
  updateBracketNode,
  deleteTournamentBracketNodes 
} from "@/lib/server-data"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const searchParams = request.nextUrl.searchParams
    const groupId = searchParams.get("groupId") || undefined

    const nodes = await getTournamentBracketNodes(id, groupId)
    return NextResponse.json(nodes)
  } catch (error) {
    console.error("Error fetching bracket nodes:", error)
    return NextResponse.json({ error: "Failed to fetch bracket nodes" }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const node = await createBracketNode({
      tournamentId: id,
      ...body,
    })

    return NextResponse.json(node, { status: 201 })
  } catch (error) {
    console.error("Error creating bracket node:", error)
    return NextResponse.json({ error: "Failed to create bracket node" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { nodeId, ...updates } = body

    if (!nodeId) {
      return NextResponse.json({ error: "Node ID is required" }, { status: 400 })
    }

    const node = await updateBracketNode(nodeId, updates)

    return NextResponse.json(node)
  } catch (error) {
    console.error("Error updating bracket node:", error)
    return NextResponse.json({ error: "Failed to update bracket node" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const searchParams = request.nextUrl.searchParams
    const groupId = searchParams.get("groupId") || undefined

    await deleteTournamentBracketNodes(id, groupId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting bracket nodes:", error)
    return NextResponse.json({ error: "Failed to delete bracket nodes" }, { status: 500 })
  }
}

