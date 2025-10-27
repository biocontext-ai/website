import { env } from "@/lib/env"
import type { Metadata } from "next"
import SignIn from "./SignIn"

export const metadata: Metadata = {
  title: "Sign In | BioContextAI",
  description:
    "Sign in to BioContextAI to create collections, contribute MCP servers, write reviews, and access personalized features.",
  keywords: ["sign in", "login", "authentication", "BioContextAI account"],
  openGraph: {
    title: "Sign In | BioContextAI",
    description: "Sign in to access personalized features and contribute to the biomedical MCP community",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
}

const SignInPage = () => {
  const isTestMode = env.NEXT_PUBLIC_TEST_MODE === "true"

  return <SignIn isTestMode={isTestMode} />
}

export default SignInPage
