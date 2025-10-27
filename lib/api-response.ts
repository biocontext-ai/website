import { NextResponse } from "next/server"

/**
 * Standard API response format for versioned endpoints
 */
interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  meta: {
    version: string
    total?: number
  }
}

/**
 * Create a successful API response
 */
export function createSuccessResponse<T>(
  data: T,
  options: {
    version: string
    total?: number
    status?: number
  },
): NextResponse<ApiResponse<T>> {
  const response: ApiResponse<T> = {
    success: true,
    data,
    meta: {
      version: options.version,
      ...(options.total !== undefined && { total: options.total }),
    },
  }

  return NextResponse.json(response, { status: options.status || 200 })
}

/**
 * Create an error API response
 */
export function createErrorResponse(
  error: string,
  options: {
    version: string
    status: number
  },
): NextResponse<ApiResponse> {
  const response: ApiResponse = {
    success: false,
    error,
    meta: {
      version: options.version,
    },
  }

  return NextResponse.json(response, { status: options.status })
}

/**
 * Create a server error response (500)
 */
export function createServerErrorResponse(error: string, version: string): NextResponse<ApiResponse> {
  return createErrorResponse(error, { version, status: 500 })
}

/**
 * Create a not found response (404)
 */
export function createNotFoundResponse(error: string, version: string): NextResponse<ApiResponse> {
  return createErrorResponse(error, { version, status: 404 })
}

/**
 * Create a bad request response (400)
 */
export function createBadRequestResponse(error: string, version: string): NextResponse<ApiResponse> {
  return createErrorResponse(error, { version, status: 400 })
}
