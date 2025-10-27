import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { logSecurityEventFromRequest, SecurityEventType } from "@/lib/security-events"
import { UserRole, UserStatus } from "@prisma/client"
import { NextRequest, NextResponse } from "next/server"

export interface AuthenticatedUser {
  id: string
  name?: string | null
  email?: string | null
  image?: string | null
  isAdmin?: boolean
}

export async function isUserAdmin(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  })
  return user?.role === UserRole.ADMIN
}

export async function requireAuth(request: NextRequest): Promise<AuthenticatedUser> {
  const session = await auth()

  if (!session?.user?.id) {
    // Log authentication failure
    await logSecurityEventFromRequest(request, SecurityEventType.AUTH_FAILURE, {
      action: "access",
      success: false,
    })
    throw new Error("Authentication required")
  }

  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    image: session.user.image,
  }
}

export async function requireAdmin(request: NextRequest): Promise<AuthenticatedUser> {
  const user = await requireAuth(request)
  const adminStatus = await isUserAdmin(user.id)

  if (!adminStatus) {
    // Log authorization failure
    await logSecurityEventFromRequest(request, SecurityEventType.AUTHZ_FAILURE, {
      userId: user.id,
      action: "admin_access",
      success: false,
      metadata: {
        requiredRole: "ADMIN",
        userRole: "USER",
      },
    })
    throw new Error("Admin access required")
  }

  return {
    ...user,
    isAdmin: true,
  }
}

export function createAuthHandler<T extends any[]>(
  handler: (request: NextRequest, user: AuthenticatedUser, ...args: T) => Promise<NextResponse>,
  requireAdminAccess = false,
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    try {
      const user = requireAdminAccess ? await requireAdmin(request) : await requireAuth(request)

      return await handler(request, user, ...args)
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "Authentication required") {
          return NextResponse.json({ error: "Authentication required" }, { status: 401 })
        }
        if (error.message === "Admin access required") {
          return NextResponse.json({ error: "Admin access required" }, { status: 403 })
        }
      }
      throw error
    }
  }
}

// Helper function for optional auth (user might or might not be authenticated)
export async function getOptionalAuth(request: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    return await requireAuth(request)
  } catch {
    return null
  }
}

// Check if a user can sign in (not blocked)
export async function canSignIn(email: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { status: true },
  })

  // If user doesn't exist yet, they can sign in (will be created)
  if (!user) return true

  // Check if user is not blocked
  return user.status !== UserStatus.BLOCKED
}

// Block a user
export async function blockUser(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId, role: { not: UserRole.ADMIN } },
    data: { status: UserStatus.BLOCKED },
  })
}

// Unblock a user
export async function unblockUser(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { status: UserStatus.ACTIVE },
  })
}

// Delete a user and all their data
export async function deleteUser(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  })

  if (user?.role === UserRole.ADMIN) {
    throw new Error("Cannot delete admin users")
  }

  await prisma.user.delete({
    where: {
      id: userId,
      role: {
        not: UserRole.ADMIN,
      },
    },
  })
}

// Get all users with pagination (admin only)
export async function getAllUsers(page: number = 1, pageSize: number = 10, search?: string) {
  const skip = (page - 1) * pageSize

  // Build where clause for search
  const whereClause = search
    ? {
        OR: [
          {
            name: {
              contains: search,
              mode: "insensitive" as const,
            },
          },
          {
            email: {
              contains: search,
              mode: "insensitive" as const,
            },
          },
        ],
      }
    : {}

  const [users, totalUsers] = await Promise.all([
    prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            reviews: true,
            collections: true,
            blogPosts: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: pageSize,
    }),
    prisma.user.count({
      where: whereClause,
    }),
  ])

  const totalPages = Math.ceil(totalUsers / pageSize)

  return {
    users,
    pagination: {
      page,
      pageSize,
      totalUsers,
      totalPages,
    },
  }
}
