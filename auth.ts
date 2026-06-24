import NextAuth from "next-auth"
import "next-auth/jwt"

import { providers } from "@/auth.providers"
import { canSignIn } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { PrismaAdapter } from "@auth/prisma-adapter"

export { providerMap } from "@/auth.providers"

export const { handlers, auth, signIn, signOut } = NextAuth({
  debug: process.env.NODE_ENV === "development",
  theme: { logo: undefined, colorScheme: "auto" },
  adapter: PrismaAdapter(prisma),
  providers,
  basePath: "/auth",
  session: { strategy: "jwt" },
  pages: {
    signIn: "/signin",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // Check if user can sign in (not blocked)
      if (user.email) {
        const canUserSignIn = await canSignIn(user.email)
        if (!canUserSignIn) {
          return false
        }
      }
      return true
    },
    jwt({ token, trigger, session, account, user }) {
      if (trigger === "update") token.name = session.user.name
      if (account && user) {
        token.id = user.id
      }
      if (account?.provider === "github" || account?.provider === "linkedin") {
        return { ...token, accessToken: account.access_token, refreshToken: account.refresh_token }
      }
      return token
    },
    async session({ session, token }) {
      if (token?.accessToken) session.accessToken = token.accessToken
      if (token?.id) session.user.id = token.id as string

      return session
    },
  },
})

declare module "next-auth" {
  interface Session {
    accessToken?: string
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string
    id?: string
  }
}
