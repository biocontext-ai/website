import { timingSafeEqual } from "crypto"
import { NextRequest } from "next/server"

import { checkIpRateLimit, getClientIp, RateLimitConfig } from "@/lib/rate-limiting"
import { logSecurityEventFromRequest, SecurityEventType } from "@/lib/security-events"

const CRON_RATE_LIMIT: RateLimitConfig = {
  windowMs: 60 * 1000,
  maxRequests: 20,
  resourceType: "cron",
}

const CRON_DAILY_RATE_LIMIT: RateLimitConfig = {
  windowMs: 24 * 60 * 60 * 1000,
  maxRequests: 100,
  resourceType: "cron-daily",
}

export function isCronRequest(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization")
  const expectedToken = process.env.CRON_SECRET

  if (!expectedToken || !authHeader) {
    return false
  }

  const match = authHeader.match(/^Bearer\s+(.+)$/i)
  if (!match) {
    return false
  }

  const providedToken = match[1]

  try {
    const expectedBuffer = Buffer.from(expectedToken, "utf8")
    const providedBuffer = Buffer.from(providedToken, "utf8")

    if (expectedBuffer.length !== providedBuffer.length) {
      return false
    }

    return timingSafeEqual(expectedBuffer, providedBuffer)
  } catch {
    return false
  }
}

export async function verifyCronRequest(request: NextRequest): Promise<boolean> {
  const clientIp = getClientIp(request)

  const isValidToken = isCronRequest(request)

  if (!isValidToken) {
    await logSecurityEventFromRequest(request, SecurityEventType.CRON_AUTH_FAILURE, {
      action: "cron_authentication",
      success: false,
      metadata: {
        hasAuthHeader: !!request.headers.get("authorization"),
        path: request.nextUrl.pathname,
        ip: clientIp,
      },
    })
    return false
  }

  const rateLimitMinute = await checkIpRateLimit(clientIp, CRON_RATE_LIMIT)

  if (!rateLimitMinute.allowed) {
    await logSecurityEventFromRequest(request, SecurityEventType.RATE_LIMIT_EXCEEDED, {
      action: "cron_rate_limit_minute",
      success: false,
      metadata: {
        ip: clientIp,
        limit: CRON_RATE_LIMIT.maxRequests,
        window: "1 minute",
        resetTime: rateLimitMinute.resetTime,
      },
    })
    return false
  }

  const rateLimitDaily = await checkIpRateLimit(clientIp, CRON_DAILY_RATE_LIMIT)

  if (!rateLimitDaily.allowed) {
    await logSecurityEventFromRequest(request, SecurityEventType.RATE_LIMIT_EXCEEDED, {
      action: "cron_rate_limit_daily",
      success: false,
      metadata: {
        ip: clientIp,
        limit: CRON_DAILY_RATE_LIMIT.maxRequests,
        window: "24 hours",
        resetTime: rateLimitDaily.resetTime,
      },
    })
    return false
  }

  return true
}
