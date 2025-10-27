import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Lock, MessageCircle } from "lucide-react"
import Link from "next/link"

export default function ChatSignInRequired() {
  return (
    <div className="flex pt-12 flex-col gap-6 max-w-md mx-auto">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-xl">Sign in required</CardTitle>
          <CardDescription className="text-center">
            To prevent spam and ensure the best experience, you need to sign in to access the chat feature.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 rounded-lg border p-3">
            <MessageCircle className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">BioContextAI Chat</p>
              <p className="text-xs text-muted-foreground">
                Get expert biomedical research assistance with access to specialized databases and tools
              </p>
            </div>
          </div>
          <Button asChild className="w-full">
            <Link href="/signin?callbackUrl=/chat">Sign in to continue</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
