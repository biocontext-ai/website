import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Legal | BioContextAI",
  description: "Legal information, terms of service, privacy policy, and legal notices for BioContextAI",
  robots: {
    index: true,
    follow: true,
  },
}

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container py-6">
      <div className="prose prose-slate dark:prose-invert">{children}</div>
    </div>
  )
}
