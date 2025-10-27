import { createAuthHandler } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

export const GET = createAuthHandler(async (request: NextRequest, user) => {
  try {
    if (!user.id) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        accounts: {
          select: {
            provider: true,
            providerAccountId: true,
            type: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        sessions: {
          select: {
            sessionToken: true,
            expires: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        reviews: {
          include: {
            mcpServer: {
              select: {
                id: true,
                name: true,
                identifier: true,
              },
            },
          },
        },
        collections: {
          include: {
            items: {
              include: {
                mcpServer: {
                  select: {
                    id: true,
                    name: true,
                    identifier: true,
                  },
                },
              },
            },
          },
        },
        blogPosts: {
          select: {
            id: true,
            title: true,
            slug: true,
            excerpt: true,
            content: true,
            published: true,
            publishedAt: true,
            metaTitle: true,
            metaDescription: true,
            keywords: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        chatRateLimit: true,
      },
    })

    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const rateLimits = await prisma.rateLimit.findMany({
      where: { userId: user.id },
      select: {
        resourceType: true,
        requestCount: true,
        windowStartTime: true,
        lastRequestTime: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    const exportData = {
      exportDate: new Date().toISOString(),
      exportVersion: "1.0",
      user: {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        emailVerified: userData.emailVerified,
        image: userData.image,
        role: userData.role,
        status: userData.status,
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt,
      },
      accounts: userData.accounts,
      sessions: userData.sessions,
      reviews: userData.reviews,
      collections: userData.collections,
      blogPosts: userData.blogPosts,
      chatRateLimit: userData.chatRateLimit,
      rateLimits: rateLimits,
    }

    const response = NextResponse.json(exportData, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="user-data-export-${user.id}-${new Date().toISOString().split("T")[0]}.json"`,
      },
    })

    return response
  } catch (error) {
    console.error("Error exporting user data:", error)
    return NextResponse.json({ error: "Failed to export user data" }, { status: 500 })
  }
})
