"use client"

import { Toaster } from "@/components/ui/sonner"
import { SessionProvider } from "next-auth/react"

interface ProvidersProps {
  children: React.ReactNode
  session?: any
}

export default function Providers({ children, session }: ProvidersProps) {
  return (
    <SessionProvider basePath={"/auth"} session={session}>
      {children}
      <Toaster />
    </SessionProvider>
  )
}
