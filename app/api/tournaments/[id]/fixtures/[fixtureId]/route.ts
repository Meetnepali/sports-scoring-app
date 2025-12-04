import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import { requireAdmin } from "@/lib/authorization"

// Update a fixture
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; fixtureId: string }> }
) {
  try {
    const { fixtureId } = await params
    const body = await request.json()
    const { matchDate, venue, status } = body
    
    const updateFields: string[] = []
    const values: any[] = []
    let paramIndex = 1
    
    if (matchDate !== undefined) {
      updateFields.push(`match_date = $${paramIndex++}`)
      values.push(matchDate)
    }
    
    if (status !== undefined) {
      updateFields.push(`status = $${paramIndex++}`)
      values.push(status)
    }
    
    if (updateFields.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 })
    }
    
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`)
    values.push(fixtureId)
    
    const result = await query(
      `UPDATE group_matches
       SET ${updateFields.join(", ")}
       WHERE id = $${paramIndex}
       RETURNING *`,
      values
    )
    
    if (result.length === 0) {
      return NextResponse.json({ error: "Fixture not found" }, { status: 404 })
    }
    
    // Also update global match if venue is provided
    if (venue !== undefined && result[0].match_id) {
      await query(
        `UPDATE matches SET venue = $1 WHERE id = $2`,
        [venue, result[0].match_id]
      )
    }
    
    if (matchDate !== undefined && result[0].match_id) {
      await query(
        `UPDATE matches SET match_date = $1 WHERE id = $2`,
        [matchDate, result[0].match_id]
      )
    }
    
    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Error updating fixture:", error)
    return NextResponse.json({ error: "Failed to update fixture" }, { status: 500 })
  }
}

// Delete a fixture
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; fixtureId: string }> }
) {
  const adminCheck = await requireAdmin(request)
  if (adminCheck) {
    return adminCheck
  }

  try {
    const { fixtureId } = await params
    
    // Get the match_id before deleting
    const fixture = await query(
      `SELECT match_id FROM group_matches WHERE id = $1`,
      [fixtureId]
    )
    
    if (fixture.length === 0) {
      return NextResponse.json({ error: "Fixture not found" }, { status: 404 })
    }
    
    const matchId = fixture[0].match_id
    
    // Delete from group_matches
    await query(`DELETE FROM group_matches WHERE id = $1`, [fixtureId])
    
    // Delete from global matches table if linked
    if (matchId) {
      await query(`DELETE FROM matches WHERE id = $1`, [matchId])
    }
    
    return NextResponse.json({ success: true, message: "Fixture deleted successfully" })
  } catch (error) {
    console.error("Error deleting fixture:", error)
    return NextResponse.json({ error: "Failed to delete fixture" }, { status: 500 })
  }
}

