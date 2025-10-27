import { validateMcpServerUrl } from "@/lib/url-validation"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const validateSchema = z.object({
  url: z.string().min(1, "URL is required"),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = validateSchema.parse(body)

    const result = await validateMcpServerUrl(validated.url)

    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ valid: false, reason: "Invalid request format" }, { status: 400 })
    }
    return NextResponse.json({ valid: false, reason: "Validation failed" }, { status: 500 })
  }
}
