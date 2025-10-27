import { prisma } from "@/lib/prisma"
import { NextRequest } from "next/server"
import "server-only"

export interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
  resourceType: string // Type of resource being rate limited
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: Date
  totalRequests: number
}

// Predefined rate limit configurations
export const RATE_LIMITS = {
  CHAT_FREE: {
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    maxRequests: 50,
    resourceType: "chat",
  },
  REVIEWS: {
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    maxRequests: 20,
    resourceType: "reviews",
  },
  COLLECTIONS: {
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    maxRequests: 50,
    resourceType: "collections",
  },
  REPORTS_AUTHENTICATED: {
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    maxRequests: 100,
    resourceType: "reports",
  },
  REPORTS_UNAUTHENTICATED: {
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    maxRequests: 50,
    resourceType: "reports",
  },
} as const

/**
 * Extract IP address from request headers
 * Checks common headers set by proxies and load balancers
 */
export function getClientIp(request: NextRequest): string {
  // Try to get real IP from various headers
  const forwardedFor = request.headers.get("x-forwarded-for")
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwardedFor.split(",")[0].trim()
  }

  const realIp = request.headers.get("x-real-ip")
  if (realIp) {
    return realIp
  }

  // Fallback to connection remote address (may not be available in all environments)
  return "unknown"
}

/**
 * Check rate limit for authenticated users (user ID based)
 */
export async function checkUserRateLimit(userId: string, config: RateLimitConfig): Promise<RateLimitResult> {
  const now = new Date()
  const windowStart = new Date(now.getTime() - config.windowMs)

  // Find or create rate limit record
  let rateLimit = await prisma.rateLimit.findUnique({
    where: {
      userId_resourceType: {
        userId: userId,
        resourceType: config.resourceType,
      },
    },
  })

  // If no record exists, create one
  if (!rateLimit) {
    rateLimit = await prisma.rateLimit.create({
      data: {
        userId: userId,
        resourceType: config.resourceType,
        requestCount: 1,
        windowStartTime: now,
        lastRequestTime: now,
      },
    })
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: new Date(now.getTime() + config.windowMs),
      totalRequests: 1,
    }
  }

  // Check if the current window has expired
  if (rateLimit.windowStartTime < windowStart) {
    // Reset the window
    rateLimit = await prisma.rateLimit.update({
      where: {
        userId_resourceType: {
          userId: userId,
          resourceType: config.resourceType,
        },
      },
      data: {
        requestCount: 1,
        windowStartTime: now,
        lastRequestTime: now,
      },
    })
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: new Date(now.getTime() + config.windowMs),
      totalRequests: 1,
    }
  }

  // Check if user has exceeded the limit
  if (rateLimit.requestCount >= config.maxRequests) {
    const resetTime = new Date(rateLimit.windowStartTime.getTime() + config.windowMs)
    return {
      allowed: false,
      remaining: 0,
      resetTime,
      totalRequests: rateLimit.requestCount,
    }
  }

  // Increment the request count
  rateLimit = await prisma.rateLimit.update({
    where: {
      userId_resourceType: {
        userId: userId,
        resourceType: config.resourceType,
      },
    },
    data: {
      requestCount: rateLimit.requestCount + 1,
      lastRequestTime: now,
    },
  })

  const resetTime = new Date(rateLimit.windowStartTime.getTime() + config.windowMs)
  return {
    allowed: true,
    remaining: config.maxRequests - rateLimit.requestCount,
    resetTime,
    totalRequests: rateLimit.requestCount,
  }
}

/**
 * Check rate limit for unauthenticated users (IP based)
 */
export async function checkIpRateLimit(ipAddress: string, config: RateLimitConfig): Promise<RateLimitResult> {
  const now = new Date()
  const windowStart = new Date(now.getTime() - config.windowMs)

  // Find or create rate limit record
  let rateLimit = await prisma.rateLimit.findUnique({
    where: {
      ipAddress_resourceType: {
        ipAddress: ipAddress,
        resourceType: config.resourceType,
      },
    },
  })

  // If no record exists, create one
  if (!rateLimit) {
    rateLimit = await prisma.rateLimit.create({
      data: {
        ipAddress: ipAddress,
        resourceType: config.resourceType,
        requestCount: 1,
        windowStartTime: now,
        lastRequestTime: now,
      },
    })
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: new Date(now.getTime() + config.windowMs),
      totalRequests: 1,
    }
  }

  // Check if the current window has expired
  if (rateLimit.windowStartTime < windowStart) {
    // Reset the window
    rateLimit = await prisma.rateLimit.update({
      where: {
        ipAddress_resourceType: {
          ipAddress: ipAddress,
          resourceType: config.resourceType,
        },
      },
      data: {
        requestCount: 1,
        windowStartTime: now,
        lastRequestTime: now,
      },
    })
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: new Date(now.getTime() + config.windowMs),
      totalRequests: 1,
    }
  }

  // Check if IP has exceeded the limit
  if (rateLimit.requestCount >= config.maxRequests) {
    const resetTime = new Date(rateLimit.windowStartTime.getTime() + config.windowMs)
    return {
      allowed: false,
      remaining: 0,
      resetTime,
      totalRequests: rateLimit.requestCount,
    }
  }

  // Increment the request count
  rateLimit = await prisma.rateLimit.update({
    where: {
      ipAddress_resourceType: {
        ipAddress: ipAddress,
        resourceType: config.resourceType,
      },
    },
    data: {
      requestCount: rateLimit.requestCount + 1,
      lastRequestTime: now,
    },
  })

  const resetTime = new Date(rateLimit.windowStartTime.getTime() + config.windowMs)
  return {
    allowed: true,
    remaining: config.maxRequests - rateLimit.requestCount,
    resetTime,
    totalRequests: rateLimit.requestCount,
  }
}

/**
 * Combined rate limit check - uses user ID if available, falls back to IP
 */
export async function checkRateLimit(
  request: NextRequest,
  userId: string | null,
  config: RateLimitConfig,
): Promise<RateLimitResult> {
  if (userId) {
    return checkUserRateLimit(userId, config)
  }

  const ipAddress = getClientIp(request)
  if (ipAddress === "unknown") {
    // If we can't determine IP, apply stricter limits
    return {
      allowed: false,
      remaining: 0,
      resetTime: new Date(Date.now() + config.windowMs),
      totalRequests: config.maxRequests,
    }
  }

  return checkIpRateLimit(ipAddress, config)
}

/**
 * Create a rate limit error response with appropriate headers
 */
export function createRateLimitError(result: RateLimitResult) {
  const resetTimeFormatted = result.resetTime.toLocaleString()
  const retryAfter = Math.ceil((result.resetTime.getTime() - Date.now()) / 1000) // seconds

  const response = new Response(
    JSON.stringify({
      error: "Rate limit exceeded",
      message: `Too many requests. Please try again after ${resetTimeFormatted}`,
      resetTime: result.resetTime.toISOString(),
      retryAfter: retryAfter,
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": retryAfter.toString(),
        "X-RateLimit-Limit": result.totalRequests.toString(),
        "X-RateLimit-Remaining": result.remaining.toString(),
        "X-RateLimit-Reset": result.resetTime.toISOString(),
      },
    },
  )

  // Return as any to work with both Response and NextResponse contexts
  return response as any
}
