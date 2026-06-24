import { config } from "dotenv"
import path from "node:path"
import { defineConfig } from "prisma/config"

config({ path: path.resolve(process.cwd(), ".env.local"), quiet: true })
config({ path: path.resolve(process.cwd(), ".env"), quiet: true })

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  datasource: {
    url: process.env.DATABASE_URL,
    shadowDatabaseUrl: process.env.SHADOW_DATABASE_URL,
  },
})
