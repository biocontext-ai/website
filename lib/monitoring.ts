import { prisma } from "@/lib/prisma"

interface LogContext {
  userId?: string
  requestId?: string
  ip?: string
  userAgent?: string
  endpoint?: string
  method?: string
  [key: string]: any
}

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

class Logger {
  private logLevel: LogLevel

  constructor() {
    // Set log level based on environment
    this.logLevel = process.env.NODE_ENV === "production" ? LogLevel.INFO : LogLevel.DEBUG
  }

  private formatMessage(level: string, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString()
    const baseLog = {
      timestamp,
      level,
      message,
      environment: process.env.NODE_ENV,
      ...context,
    }

    return JSON.stringify(baseLog)
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.logLevel
  }

  debug(message: string, context?: LogContext) {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log(this.formatMessage("DEBUG", message, context))
    }
  }

  info(message: string, context?: LogContext) {
    if (this.shouldLog(LogLevel.INFO)) {
      console.log(this.formatMessage("INFO", message, context))
    }
  }

  warn(message: string, context?: LogContext) {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage("WARN", message, context))
    }
  }

  error(message: string, error?: Error, context?: LogContext) {
    if (this.shouldLog(LogLevel.ERROR)) {
      const errorContext = {
        ...context,
        error: error
          ? {
              name: error.name,
              message: error.message,
              stack: error.stack,
            }
          : undefined,
      }
      console.error(this.formatMessage("ERROR", message, errorContext))
    }
  }

  // API-specific logging methods
  apiRequest(method: string, endpoint: string, context?: LogContext) {
    this.info(`API Request: ${method} ${endpoint}`, {
      ...context,
      method,
      endpoint,
      type: "api_request",
    })
  }

  apiResponse(method: string, endpoint: string, statusCode: number, duration: number, context?: LogContext) {
    this.info(`API Response: ${method} ${endpoint} ${statusCode}`, {
      ...context,
      method,
      endpoint,
      statusCode,
      duration,
      type: "api_response",
    })
  }

  security(event: string, context?: LogContext) {
    this.warn(`Security Event: ${event}`, {
      ...context,
      type: "security",
    })
  }

  database(operation: string, table: string, duration?: number, context?: LogContext) {
    this.debug(`Database: ${operation} on ${table}`, {
      ...context,
      operation,
      table,
      duration,
      type: "database",
    })
  }
}

export const logger = new Logger()

// Middleware to extract request context
export function getRequestContext(request: Request): LogContext {
  const url = new URL(request.url)
  const requestHeaders = request.headers
  return {
    method: request.method,
    endpoint: url.pathname,
    ip: requestHeaders.get("x-forwarded-for") || requestHeaders.get("x-real-ip") || "unknown",
    userAgent: requestHeaders.get("user-agent") || "unknown",
    requestId: crypto.randomUUID(),
  }
}

// Performance monitoring
export class PerformanceMonitor {
  private startTime: number

  constructor() {
    this.startTime = Date.now()
  }

  end(): number {
    return Date.now() - this.startTime
  }

  static time<T>(operation: string, fn: () => Promise<T>): Promise<T> {
    const monitor = new PerformanceMonitor()
    return fn().finally(() => {
      const duration = monitor.end()
      logger.debug(`Performance: ${operation} took ${duration}ms`, {
        operation,
        duration,
        type: "performance",
      })
    })
  }
}

// Health check utilities
export interface HealthStatus {
  status: "healthy" | "unhealthy" | "degraded"
  checks: Record<string, boolean>
  timestamp: string
  uptime: number
}

export async function getHealthStatus(): Promise<HealthStatus> {
  const checks: Record<string, boolean> = {}

  // Database check
  try {
    await prisma.$queryRaw`SELECT 1`
    checks.database = true
  } catch {
    checks.database = false
  }

  // External API checks could be added here
  checks.github_api = !!process.env.GITHUB_TOKEN
  checks.gemini_api = !!process.env.GEMINI_API_KEY

  const allHealthy = Object.values(checks).every(Boolean)
  const someHealthy = Object.values(checks).some(Boolean)

  return {
    status: allHealthy ? "healthy" : someHealthy ? "degraded" : "unhealthy",
    checks,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  }
}
