import { getRequestContext, logger } from "@/lib/monitoring"
import { NextRequest } from "next/server"

/**
 * Security event types for logging and monitoring
 */
export enum SecurityEventType {
  AUTH_FAILURE = "auth_failure",
  AUTH_SUCCESS = "auth_success",
  AUTHZ_FAILURE = "authz_failure",
  RATE_LIMIT_EXCEEDED = "rate_limit_exceeded",
  SUSPICIOUS_INPUT = "suspicious_input",
  ADMIN_ACTION = "admin_action",
  CSRF_VIOLATION = "csrf_violation",
  IDOR_ATTEMPT = "idor_attempt",
  SSRF_ATTEMPT = "ssrf_attempt",
  USER_BLOCKED = "user_blocked",
  USER_DELETED = "user_deleted",
  INVALID_URL = "invalid_url",
  CRON_AUTH_FAILURE = "cron_auth_failure",
}

/**
 * Security event severity levels
 */
export enum SecurityEventSeverity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

/**
 * Security event data structure
 */
export interface SecurityEvent {
  type: SecurityEventType
  severity: SecurityEventSeverity
  userId?: string
  ip?: string
  userAgent?: string
  resource: string
  action: string
  success: boolean
  metadata?: Record<string, any>
  timestamp: Date
}

/**
 * Determines the severity of a security event
 */
function getEventSeverity(type: SecurityEventType): SecurityEventSeverity {
  const severityMap: Record<SecurityEventType, SecurityEventSeverity> = {
    [SecurityEventType.AUTH_FAILURE]: SecurityEventSeverity.MEDIUM,
    [SecurityEventType.AUTH_SUCCESS]: SecurityEventSeverity.LOW,
    [SecurityEventType.AUTHZ_FAILURE]: SecurityEventSeverity.HIGH,
    [SecurityEventType.RATE_LIMIT_EXCEEDED]: SecurityEventSeverity.MEDIUM,
    [SecurityEventType.SUSPICIOUS_INPUT]: SecurityEventSeverity.MEDIUM,
    [SecurityEventType.ADMIN_ACTION]: SecurityEventSeverity.MEDIUM,
    [SecurityEventType.CSRF_VIOLATION]: SecurityEventSeverity.HIGH,
    [SecurityEventType.IDOR_ATTEMPT]: SecurityEventSeverity.CRITICAL,
    [SecurityEventType.SSRF_ATTEMPT]: SecurityEventSeverity.CRITICAL,
    [SecurityEventType.USER_BLOCKED]: SecurityEventSeverity.MEDIUM,
    [SecurityEventType.USER_DELETED]: SecurityEventSeverity.MEDIUM,
    [SecurityEventType.INVALID_URL]: SecurityEventSeverity.MEDIUM,
    [SecurityEventType.CRON_AUTH_FAILURE]: SecurityEventSeverity.HIGH,
  }

  return severityMap[type] || SecurityEventSeverity.LOW
}

/**
 * Determines if an event should be persisted to the database
 * Currently only logs to console, but can be extended to store in DB
 */
function shouldPersistEvent(type: SecurityEventType): boolean {
  // Only persist critical and high-severity events
  const severity = getEventSeverity(type)
  return severity === SecurityEventSeverity.CRITICAL || severity === SecurityEventSeverity.HIGH
}

/**
 * Determines if an event requires immediate alerting
 */
function isCriticalEvent(event: SecurityEvent): boolean {
  return event.severity === SecurityEventSeverity.CRITICAL
}

/**
 * Logs a security event with proper context and severity
 */
export async function logSecurityEvent(event: SecurityEvent): Promise<void> {
  const severity = getEventSeverity(event.type)

  // Log to console with appropriate log level
  const logData = {
    type: event.type,
    severity,
    userId: event.userId,
    ip: event.ip,
    userAgent: event.userAgent,
    resource: event.resource,
    action: event.action,
    success: event.success,
    metadata: event.metadata,
    timestamp: event.timestamp,
  }

  switch (severity) {
    case SecurityEventSeverity.CRITICAL:
      logger.error(`SECURITY [${event.type}]`, new Error(`Critical security event: ${event.type}`), logData)
      break
    case SecurityEventSeverity.HIGH:
      logger.error(`SECURITY [${event.type}]`, new Error(`High severity security event: ${event.type}`), logData)
      break
    case SecurityEventSeverity.MEDIUM:
      logger.warn(`SECURITY [${event.type}]`, logData)
      break
    case SecurityEventSeverity.LOW:
      logger.info(`SECURITY [${event.type}]`, logData)
      break
  }

  // In production, you might want to:
  // 1. Store critical events in database
  // 2. Send alerts via email/Slack/PagerDuty
  // 3. Push to external monitoring service

  if (shouldPersistEvent(event.type)) {
    // TODO: Implement database persistence if needed
    // await prisma.securityEvent.create({ data: event })
  }

  if (isCriticalEvent(event)) {
    // TODO: Implement alerting for critical events
    // await sendSecurityAlert(event)
  }
}

/**
 * Helper function to create and log a security event from a request
 */
export async function logSecurityEventFromRequest(
  request: NextRequest,
  type: SecurityEventType,
  options: {
    userId?: string
    action: string
    success: boolean
    metadata?: Record<string, any>
  },
): Promise<void> {
  const context = getRequestContext(request)

  await logSecurityEvent({
    type,
    severity: getEventSeverity(type),
    userId: options.userId,
    ip: context.ip,
    userAgent: context.userAgent,
    resource: request.nextUrl.pathname,
    action: options.action,
    success: options.success,
    metadata: options.metadata,
    timestamp: new Date(),
  })
}
