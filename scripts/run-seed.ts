import { execSync } from "child_process"
import { join } from "path"

// Run the seed script
try {
  console.log("Running database seed script...")

  // Execute the seed script
  execSync("ts-node seed-database.ts", {
    cwd: join(process.cwd(), "scripts"),
    stdio: "inherit",
  })

  console.log("Database seed completed successfully!")
} catch (error) {
  console.error("Error running seed script:", error)
  process.exit(1)
}
