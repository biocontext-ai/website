import { getHealthStatus } from "@/lib/monitoring"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const health = await getHealthStatus()

    const statusCode = health.status === "healthy" ? 200 : health.status === "degraded" ? 206 : 503

    return NextResponse.json(health, { status: statusCode })
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    )
  }
}

export async function HEAD(request: NextRequest) {
  try {
    const health = await getHealthStatus()
    const statusCode = health.status === "healthy" ? 200 : 503
    return new NextResponse(null, { status: statusCode })
  } catch {
    return new NextResponse(null, { status: 503 })
  }
}
