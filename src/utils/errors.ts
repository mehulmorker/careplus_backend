/**
 * Base application error class
 * All custom errors should extend this
 */
export class AppError extends Error {
  public readonly isOperational: boolean;
  public readonly timestamp: Date;

  constructor(
    public readonly message: string,
    public readonly code: string,
    public readonly statusCode: number = 400,
    isOperational: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    this.isOperational = isOperational;
    this.timestamp = new Date();

    // Maintains proper stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      timestamp: this.timestamp,
    };
  }
}

/**
 * Validation errors - invalid input data
 */
export class ValidationError extends AppError {
  constructor(
    message: string,
    public readonly field?: string,
    public readonly details?: Record<string, string>
  ) {
    super(message, "VALIDATION_ERROR", 400);
  }
}

/**
 * Input validation with multiple field errors
 */
export class InputValidationError extends AppError {
  constructor(
    public readonly errors: Array<{ field: string; message: string }>
  ) {
    super("Validation failed", "INPUT_VALIDATION_ERROR", 400);
  }
}

/**
 * Resource not found
 */
export class NotFoundError extends AppError {
  constructor(resource: string = "Resource", id?: string) {
    const message = id
      ? `${resource} with id '${id}' not found`
      : `${resource} not found`;
    super(message, "NOT_FOUND", 404);
  }
}

/**
 * Authentication failed - not logged in
 */
export class AuthenticationError extends AppError {
  constructor(message: string = "Authentication required") {
    super(message, "UNAUTHENTICATED", 401);
  }
}

/**
 * Authorization failed - no permission
 */
export class AuthorizationError extends AppError {
  constructor(
    message: string = "You do not have permission to perform this action"
  ) {
    super(message, "FORBIDDEN", 403);
  }
}

/**
 * Conflict - duplicate resource
 */
export class ConflictError extends AppError {
  constructor(message: string = "Resource already exists") {
    super(message, "CONFLICT", 409);
  }
}

/**
 * External service failure
 */
export class ExternalServiceError extends AppError {
  constructor(service: string, _originalError?: Error) {
    super(`${service} service is unavailable`, "EXTERNAL_SERVICE_ERROR", 503, false);
  }
}

