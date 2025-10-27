"use client"
import { providerMap } from "@/auth"
import GitHub from "@/components/icons/github"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Linkedin } from "lucide-react"
import { AuthError } from "next-auth"
import { signIn } from "next-auth/react"
import { useSearchParams } from "next/navigation"
import { useState, useTransition } from "react"

const SignIn = (props: { isTestMode: boolean }) => {
  const searchParams = useSearchParams()
  const isTestMode = !!props.isTestMode
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const signInAction = async (providerId: string, e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault() // Prevent default form submission behavior
    if (isPending) return // Prevent multiple submissions while pending
    startTransition(async () => {
      try {
        setError(null) // Reset error state before sign-in
        const formData = new FormData(e.currentTarget)
        // If using credentials, append email and password
        if (providerId === "credentials") {
          const email = formData.get("email") as string
          const password = formData.get("password") as string
          if (!email || !password) {
            setError("Email and password are required for credentials sign-in.")
            return
          }
        }
        await signIn(providerId, {
          redirect: true,
          redirectTo: searchParams.get("callbackUrl") || "/",
          email: formData.get("email") as string,
          password: formData.get("password") as string,
        })
      } catch (error) {
        console.error("Sign-in error:", error)
        if (error instanceof AuthError) {
          setError(error.message)
          return
        }
        setError("An unexpected error occurred. Please try again.")
      }
    })
  }

  return (
    <div className="flex pt-12 flex-col gap-6 max-w-md mx-auto">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6 text-primary"
            >
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <CardTitle className="text-xl">Sign in to your account</CardTitle>
          <CardDescription className="text-center">
            Sign in to access chat, create collections, and contribute to the biomedical MCP community. If you
            don&apos;t have an account, one will be created for you automatically.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            {searchParams.get("error") && (
              <Alert variant="destructive" className="bg-destructive/50">
                <AlertTitle className="text-destructive-foreground">Error</AlertTitle>
                <AlertDescription className="text-destructive-foreground">{searchParams.get("error")}</AlertDescription>
              </Alert>
            )}
            {isTestMode && (
              <>
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    startTransition(() => {
                      signInAction("credentials", e as React.FormEvent<HTMLFormElement> as any)
                    })
                  }}
                  className="flex flex-col gap-4"
                >
                  <input type="hidden" name="redirect" value={1} />
                  <input type="hidden" name="redirectTo" value="/" />
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="test@example.com"
                      defaultValue="test@example.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="password"
                      defaultValue="password"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    Sign In with Test Credentials
                  </Button>
                </form>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                  </div>
                </div>
              </>
            )}

            {Object.values(providerMap).filter((provider) => provider.id !== "credentials").length > 0 && (
              <div className="flex flex-col gap-2">
                {Object.values(providerMap)
                  .filter((provider) => provider.id !== "credentials")
                  .map((provider) => (
                    <form key={provider.id} onSubmit={signInAction.bind(null, provider.id)}>
                      <Button
                        type="submit"
                        variant="outline"
                        className="w-full disabled:opacity-50"
                        disabled={isPending}
                      >
                        {provider.name === "GitHub" && <GitHub className="w-4 h-4 mr-2" />}
                        {provider.name === "LinkedIn" && <Linkedin className="w-4 h-4 mr-2" />}
                        Sign in with {provider.name}
                      </Button>
                    </form>
                  ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default SignIn
