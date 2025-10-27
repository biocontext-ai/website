import { createAuthHandler, getAllUsers } from "@/lib/auth"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

// Search query validation schema
const userSearchSchema = z.object({
  page: z
    .string()
    .optional()
    .default("1")
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(1).max(1000)),
  pageSize: z
    .string()
    .optional()
    .default("10")
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(1).max(100)),
  search: z
    .string()
    .max(200, "Search query too long")
    .trim()
    .transform((val) => {
      return val.replace(/[<>{}[\]]/g, "")
    })
    .nullable()
    .optional(),
})

// GET /api/user - List all users with pagination (admin only)
export const GET = createAuthHandler(
  async (request: NextRequest) => {
    try {
      const { searchParams } = new URL(request.url)

      // Validate search parameters
      const validatedParams = userSearchSchema.parse({
        page: searchParams.get("page"),
        pageSize: searchParams.get("pageSize"),
        search: searchParams.get("search"),
      })

      const result = await getAllUsers(
        validatedParams.page,
        validatedParams.pageSize,
        validatedParams.search ?? undefined,
      )
      return NextResponse.json(result)
    } catch (error) {
      console.error("Error fetching users:", error)
      return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
    }
  },
  true, // Require admin access
)
