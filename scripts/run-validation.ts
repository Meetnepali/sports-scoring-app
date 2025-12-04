#!/usr/bin/env tsx

/**
 * Run Database Validation Script
 * This script validates the database structure and data integrity
 */

import { validateDatabaseStructure } from "./validate-database"

console.log("🚀 Starting Database Validation\n")
console.log("=" .repeat(60))

validateDatabaseStructure()
  .then(() => {
    console.log("\n" + "=".repeat(60))
    console.log("✅ Database validation completed successfully!")
    process.exit(0)
  })
  .catch((error) => {
    console.log("\n" + "=".repeat(60))
    console.error("❌ Database validation failed!")
    console.error(error)
    process.exit(1)
  })

