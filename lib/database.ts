import { Pool } from "pg"

// Configure connection to local PostgreSQL database only
const pool = new Pool({
  host: process.env.PGHOST || "localhost",
  port: Number.parseInt(process.env.PGPORT || "5432"),
  database: process.env.PGDATABASE || "sports_scoring_db",
  user: process.env.PGUSER || "postgres",
  password: process.env.PGPASSWORD || "postgres",
  ssl: false, // No SSL for local development
})

// Query function for executing SQL queries
export async function query(text: string, params?: any[]) {
  const client = await pool.connect()
  try {
    const result = await client.query(text, params)
    return result.rows
  } catch (error) {
    console.error("Database query error:", error)
    throw error
  } finally {
    client.release()
  }
}

// Helper function for database queries with error handling
export async function executeQuery(queryText: string, params: any[] = []) {
  try {
    const result = await query(queryText, params)
    return { success: true, data: result }
  } catch (error) {
    console.error("Database query error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export default pool
