// Re-export database functionality from database.ts
import { query, executeQuery } from "./database"
import pool from "./database"

export { query, executeQuery, pool }
export default pool