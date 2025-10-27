import { isUserAdmin } from "@/lib/auth"
import { auth } from "auth"
import { Settings, User } from "lucide-react"
import Link from "next/link"
import { SignOut } from "./auth-components"
import { Avatar, AvatarImage } from "./ui/avatar"
import { Button } from "./ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu"

export default async function UserButton() {
  const session = await auth()
  if (!session?.user)
    return (
      <Link href="/signin">
        <Button size="sm">Sign In</Button>
      </Link>
    )

  // Check if user is admin
  const adminStatus = await isUserAdmin(session.user.id)

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full bg-accent">
            {session.user.image ? (
              <Avatar className="h-8 w-8 ">
                <AvatarImage src={session.user.image} alt={session.user.name ?? ""} />
              </Avatar>
            ) : (
              <User className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56 p-2" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-3">
              <p className="text-sm font-medium leading-none">{session.user.name}</p>
              <p className="text-muted-foreground text-xs leading-none truncate">{session.user.email}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/settings" className="flex items-center gap-2 cursor-pointer">
              <Settings className="h-4 w-4" />
              Settings
            </Link>
          </DropdownMenuItem>
          {adminStatus && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/admin/user" className="flex items-center gap-2 cursor-pointer">
                  <Settings className="h-4 w-4" />
                  Admin Panel
                </Link>
              </DropdownMenuItem>
            </>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem className="mt-2">
            <SignOut />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
