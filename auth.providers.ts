import type { Provider } from "next-auth/providers"
import Credentials from "next-auth/providers/credentials"
import GitHub from "next-auth/providers/github"
import LinkedIn from "next-auth/providers/linkedin"

export const providers: Provider[] = [GitHub, LinkedIn]

if (process.env.NEXT_PUBLIC_TEST_MODE === "true") {
  const isCI = process.env.CI === "true"
  const isTestEnv = process.env.NODE_ENV === "test"
  const isDevelopment = process.env.NODE_ENV === "development"
  const isLocalhost =
    typeof process.env.NEXT_PUBLIC_BASE_URL === "string" && process.env.NEXT_PUBLIC_BASE_URL.includes("localhost")

  const isAllowedEnvironment = isCI || isTestEnv || isDevelopment || isLocalhost

  if (!isAllowedEnvironment) {
    throw new Error(
      "CRITICAL SECURITY ERROR: Test mode authentication is enabled in production environment. " +
        "This would allow anyone to authenticate with known test credentials. " +
        "Please set NEXT_PUBLIC_TEST_MODE=false in production.",
    )
  }

  if (isCI || isTestEnv) {
    console.warn("⚠️  Test mode authentication enabled in CI/test environment.")
  } else {
    console.warn(
      "⚠️  WARNING: Test mode authentication is enabled. This should only be used in development/testing environments.",
    )
  }
  providers.push(
    Credentials({
      id: "credentials",
      name: "Email and Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        if (credentials?.email === "test@example.com" && credentials?.password === "password") {
          return {
            id: "test-user-id",
            email: "test@example.com",
            name: "Test User",
            image: "https://avatars.githubusercontent.com/u/67470890?s=200&v=4",
          }
        }
        return null
      },
    }),
  )
}

export const providerMap = providers
  .map((provider) => {
    if (typeof provider === "function") {
      const providerData = provider()
      return { id: providerData.id, name: providerData.name }
    } else {
      return { id: provider.id, name: provider.name }
    }
  })
  .filter((provider) => provider.id !== "credentials")
