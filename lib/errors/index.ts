export class AppError extends Error {
  constructor(
    message: string,
    public code: string = "APP_ERROR",
    public statusCode: number = 500
  ) {
    super(message)
    this.name = "AppError"
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, "VALIDATION_ERROR", 400)
    this.name = "ValidationError"
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = "Authentication required") {
    super(message, "AUTH_ERROR", 401)
    this.name = "AuthenticationError"
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, "NOT_FOUND", 404)
    this.name = "NotFoundError"
  }
}

export class ScanningError extends AppError {
  constructor(message: string) {
    super(message, "SCANNING_ERROR", 500)
    this.name = "ScanningError"
  }
}

export function handleError(error: unknown): { success: false; message: string } {
  if (error instanceof AppError) {
    return { success: false, message: error.message }
  }

  if (error instanceof Error) {
    return { success: false, message: error.message }
  }

  return { success: false, message: "An unexpected error occurred" }
}
