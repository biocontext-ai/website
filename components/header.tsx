import { cn } from "@/lib/utils"
import { MainNav } from "./main-nav"
import { ThemeToggle } from "./theme-toggle"
import UserButton from "./user-button"

export default function Header({ className }: { className?: string }) {
  return (
    <>
      {/* <div className="w-full text-center text-pretty bg-blue-950 p-2 text-sm text-white">
        <strong className="whitespace-nowrap">Our Correspondence is out in Nature Biotechnology!</strong>&nbsp;
        <CustomLink
          href="https://www.biorxiv.org/content/10.1101/2025.07.21.665729v1.full.pdf"
          className="text-white underline"
        >
          Community-based biomedical context to unlock agentic systems
        </CustomLink>
      </div> */}
      <header
        className={cn(
          "sticky flex border-b bg-background lg:supports-[backdrop-filter]:backdrop-blur lg:supports-[backdrop-filter]:bg-background/60",
          className,
        )}
      >
        <div className="mx-auto flex h-16 w-full container items-center justify-between px-4 sm:px-6 lg:px-[2rem]">
          <MainNav>
            <div className="flex items-center gap-4">
              <UserButton />
              <ThemeToggle />
            </div>
          </MainNav>
        </div>
      </header>
    </>
  )
}
