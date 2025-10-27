import "server-only"
import { z } from "zod"

// Define the schema for environment variables
const envSchema = z.object({
  // URL
  NEXT_PUBLIC_BASE_URL: z.string().url("NEXT_PUBLIC_BASE_URL must be a valid URL"),

  // Database
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid URL"),

  // Authentication
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET must be at least 32 characters"),
  AUTH_DEBUG: z
    .string()
    .optional()
    .transform((val) => val === "true"),

  // OAuth Providers
  AUTH_GITHUB_ID: z.string().min(1, "GitHub OAuth client ID is required"),
  AUTH_GITHUB_SECRET: z.string().min(1, "GitHub OAuth secret is required"),
  AUTH_LINKEDIN_ID: z.string().min(1, "LinkedIn OAuth client ID is required"),
  AUTH_LINKEDIN_SECRET: z.string().min(1, "LinkedIn OAuth secret is required"),

  // External APIs
  GITHUB_TOKEN: z.string().min(1, "GitHub API token is required"),
  GEMINI_API_KEY: z.string().min(1, "Gemini API key is required"),

  // Bluesky (optional)
  BLUESKY_USERNAME: z.string().optional(),
  BLUESKY_PASSWORD: z.string().optional(),

  // Zulip (optional)
  ZULIP_USERNAME: z.string().email("ZULIP_USERNAME must be a valid email").optional(),
  ZULIP_API_KEY: z.string().optional(),
  ZULIP_REALM: z.string().url("ZULIP_REALM must be a valid URL").optional(),

  // Cron Jobs
  CRON_SECRET: z.string().min(16, "CRON_SECRET must be at least 16 characters"),

  // Optional
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  NEXT_PUBLIC_TEST_MODE: z.string().optional().default("false"),
})

// Validate environment variables
export function validateEnvironment() {
  try {
    const env = envSchema.parse(process.env)
    return env
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("❌ Environment variable validation failed:")
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join(".")}: ${err.message}`)
      })

      if (process.env.NODE_ENV === "production") {
        throw new Error("Environment validation failed in production")
      } else {
        console.warn("⚠️  Continuing in development mode despite validation errors")
        return process.env
      }
    }
    throw error
  }
}

// Type-safe environment access
export const env = validateEnvironment()

export type Environment = z.infer<typeof envSchema>
