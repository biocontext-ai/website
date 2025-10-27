import { auth } from "@/auth"
import { CookieNotice } from "@/components/cookie/cookie-notice"
import Footer from "@/components/footer"
import Header from "@/components/header"
import Providers from "@/components/providers"
import { ThemeProvider } from "@/components/theme-provider"
import { env } from "@/lib/env"
import type { Metadata, Viewport } from "next"
import localFont from "next/font/local"
import "./globals.css"

const inter = localFont({
  src: [
    {
      path: "../public/assets/fonts/Inter-VariableFont_opsz,wght.ttf",
      weight: "100 900",
      style: "normal",
    },
    {
      path: "../public/assets/fonts/Inter-Italic-VariableFont_opsz,wght.ttf",
      weight: "100 900",
      style: "italic",
    },
  ],
  variable: "--font-inter",
  display: "swap",
})

export const metadata: Metadata = {
  title: "BioContextAI",
  description: "Biomedical context via the Model Context Protocol for agentic systems",
  keywords: [
    "MCP",
    "Model Context Protocol",
    "biomedical",
    "healthcare",
    "AI",
    "research",
    "registry",
    "servers",
    "agentic systems",
    "bioinformatics",
    "machine learning",
    "artificial intelligence",
    "LLM",
    "large language models",
    "data integration",
  ],
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "BioContextAI",
    description: "Biomedical context via the Model Context Protocol for agentic systems",
    type: "website",
    url: "https://biocontext.ai",
    siteName: "BioContextAI",
    images: [
      {
        url: "https://biocontext.ai/ms-icon-310x310.png",
        width: 310,
        height: 310,
        alt: "BioContextAI - Biomedical context via the Model Context Protocol for agentic systems",
      },
    ],
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  themeColor: "#000000",
  colorScheme: "dark",
}

export default async function RootLayout({ children }: React.PropsWithChildren) {
  const session = await auth()

  // Filter out sensitive data before passing to client
  let clientSession = null
  if (session?.user) {
    clientSession = {
      ...session,
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
      },
    }
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" sizes="57x57" href="/apple-icon-57x57.png" />
        <link rel="apple-touch-icon" sizes="60x60" href="/apple-icon-60x60.png" />
        <link rel="apple-touch-icon" sizes="72x72" href="/apple-icon-72x72.png" />
        <link rel="apple-touch-icon" sizes="76x76" href="/apple-icon-76x76.png" />
        <link rel="apple-touch-icon" sizes="114x114" href="/apple-icon-114x114.png" />
        <link rel="apple-touch-icon" sizes="120x120" href="/apple-icon-120x120.png" />
        <link rel="apple-touch-icon" sizes="144x144" href="/apple-icon-144x144.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/apple-icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-icon-180x180.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/android-icon-192x192.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="96x96" href="/favicon-96x96.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="msapplication-TileColor" content="#ffffff" />
        <meta name="msapplication-TileImage" content="/ms-icon-144x144.png" />
        <meta name="theme-color" content="#ffffff" />

        <base href={env.NEXT_PUBLIC_BASE_URL || "https://biocontext.ai"} />
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <Providers session={clientSession}>
            <div className="flex h-full min-h-screen w-full flex-col justify-between">
              <Header className="sticky top-0 z-50" />
              <main className="w-full flex-auto">{children}</main>
              <Footer />
              <CookieNotice />
            </div>
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  )
}
