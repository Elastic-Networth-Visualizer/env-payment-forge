/**
 * Base error class for all payment-related errors.
 */
export class PaymentError extends Error {
  /** Error code for identifying the type of error */
  public readonly code: string;
  /** HTTP status code for this type of error */
  public readonly statusCode: number;
  /** Whether this error is retryable */
  public readonly retryable: boolean;
  /** Additional details about the error */
  public readonly details?: Record<string, unknown>;
  /** The original error that caused this error */
  public override cause?: Error;

  /**
   * Constructor for PaymentError.
   * @param message - Error message
   * @param options - Additional error options
   */
  constructor(message: string, options: {
    code?: string;
    statusCode?: number;
    retryable?: boolean;
    details?: Record<string, unknown>;
    cause?: Error;
  } = {}) {
    super(message);
    this.name = this.constructor.name;
    this.code = options.code || "payment_error";
    this.statusCode = options.statusCode || 500;
    this.retryable = options.retryable || false;
    this.details = options.details;
    this.cause = options.cause;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Converts the error to JSON-serializable format.
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      retryable: this.retryable,
      details: this.details,
      stack: this.stack,
    };
  }
}

/**
 * Error when validation fails
 */
export class ValidationError extends PaymentError {
  /**
   * Constructor for ValidationError.
   * @param message - Error message
   * @param details - Validation error details
   * @param cause - Original error that caused this error
   */
  constructor(message: string, details?: Record<string, unknown>, cause?: Error) {
    super(message, {
      code: "validation_error",
      statusCode: 400,
      details,
      cause,
    });
  }
}

/**
 * Error when authentication fails
 */
export class AuthenticationError extends PaymentError {
  /**
   * Constructor for AuthenticationError
   *
   * @param message Error message
   * @param details Authentication error details
   * @param cause The original error that caused this error
   */
  constructor(
    message: string,
    details?: Record<string, unknown>,
    cause?: Error,
  ) {
    super(message, {
      code: "authentication_error",
      statusCode: 401,
      details,
      cause,
    });
  }
}

/**
 * Error when an operation is not authorized
 */
export class AuthorizationError extends PaymentError {
  /**
   * Constructor for AuthorizationError
   *
   * @param message Error message
   * @param details Authorization error details
   * @param cause The original error that caused this error
   */
  constructor(
    message: string,
    details?: Record<string, unknown>,
    cause?: Error,
  ) {
    super(message, {
      code: "authorization_error",
      statusCode: 403,
      details,
      cause,
    });
  }
}

/**
 * Error when a resource is not found
 */
export class NotFoundError extends PaymentError {
  /**
   * Constructor for NotFoundError
   *
   * @param message Error message
   * @param details Not found error details
   * @param cause The original error that caused this error
   */
  constructor(
    message: string,
    details?: Record<string, unknown>,
    cause?: Error,
  ) {
    super(message, {
      code: "not_found_error",
      statusCode: 404,
      details,
      cause,
    });
  }
}

/**
 * Error when a payment provider operation fails
 */
export class ProviderError extends PaymentError {
  /**
   * Constructor for ProviderError
   *
   * @param message Error message
   * @param options Additional error options
   */
  constructor(
    message: string,
    options: {
      code?: string;
      statusCode?: number;
      retryable?: boolean;
      details?: Record<string, unknown>;
      cause?: Error;
    } = {},
  ) {
    super(message, {
      code: options.code ?? "provider_error",
      statusCode: options.statusCode ?? 502,
      retryable: options.retryable ?? true,
      details: options.details,
      cause: options.cause,
    });
  }
}

/**
 * Error when a payment is declined
 */
export class PaymentDeclinedError extends PaymentError {
  /**
   * Constructor for PaymentDeclinedError
   *
   * @param message Error message
   * @param options Additional error options
   */
  constructor(
    message: string,
    options: {
      code?: string;
      details?: Record<string, unknown>;
      cause?: Error;
    } = {},
  ) {
    super(message, {
      code: options.code ?? "payment_declined",
      statusCode: 402,
      retryable: false,
      details: options.details,
      cause: options.cause,
    });
  }
}

/**
 * Error when a rate limit is exceeded
 */
export class RateLimitError extends PaymentError {
  /**
   * Constructor for RateLimitError
   *
   * @param message Error message
   * @param retryAfter Seconds after which to retry
   * @param cause The original error that caused this error
   */
  constructor(
    message: string,
    retryAfter?: number,
    cause?: Error,
  ) {
    super(message, {
      code: "rate_limit_error",
      statusCode: 429,
      retryable: true,
      details: retryAfter ? { retryAfter } : undefined,
      cause,
    });
  }
}

/**
 * Error when a payment operation times out
 */
export class TimeoutError extends PaymentError {
  /**
   * Constructor for TimeoutError
   *
   * @param message Error message
   * @param cause The original error that caused this error
   */
  constructor(
    message: string,
    cause?: Error,
  ) {
    super(message, {
      code: "timeout_error",
      statusCode: 504,
      retryable: true,
      cause,
    });
  }
}

/**
 * Error when a duplicate payment is detected
 */
export class DuplicateError extends PaymentError {
  /**
   * Constructor for DuplicateError
   *
   * @param message Error message
   * @param existingId ID of the existing resource
   * @param cause The original error that caused this error
   */
  constructor(
    message: string,
    existingId?: string,
    cause?: Error,
  ) {
    super(message, {
      code: "duplicate_error",
      statusCode: 409,
      retryable: false,
      details: existingId ? { existingId } : undefined,
      cause,
    });
  }
}

/**
 * Error when a payment method is invalid or expired
 */
export class PaymentMethodError extends PaymentError {
  /**
   * Constructor for PaymentMethodError
   *
   * @param message Error message
   * @param options Additional error options
   */
  constructor(
    message: string,
    options: {
      code?: string;
      details?: Record<string, unknown>;
      cause?: Error;
    } = {},
  ) {
    super(message, {
      code: options.code ?? "payment_method_error",
      statusCode: 400,
      retryable: false,
      details: options.details,
      cause: options.cause,
    });
  }
}

/**
 * Error when a payment is potentially fraudulent
 */
export class FraudError extends PaymentError {
  /**
   * Constructor for FraudError
   *
   * @param message Error message
   * @param riskScore Risk score that triggered the fraud error
   * @param cause The original error that caused this error
   */
  constructor(
    message: string,
    riskScore?: number,
    cause?: Error,
  ) {
    super(message, {
      code: "fraud_error",
      statusCode: 403,
      retryable: false,
      details: riskScore !== undefined ? { riskScore } : undefined,
      cause,
    });
  }
}

/**
 * Error when insufficient funds are available
 */
export class InsufficientFundsError extends PaymentError {
  /**
   * Constructor for InsufficientFundsError
   *
   * @param message Error message
   * @param cause The original error that caused this error
   */
  constructor(
    message: string,
    cause?: Error,
  ) {
    super(message, {
      code: "insufficient_funds",
      statusCode: 402,
      retryable: false,
      cause,
    });
  }
}

/**
 * Error when a payment processor configuration is invalid
 */
export class ConfigurationError extends PaymentError {
  /**
   * Constructor for ConfigurationError
   *
   * @param message Error message
   * @param cause The original error that caused this error
   */
  constructor(
    message: string,
    cause?: Error,
  ) {
    super(message, {
      code: "configuration_error",
      statusCode: 500,
      retryable: false,
      cause,
    });
  }
}

/**
 * Convert any error to a PaymentError
 * @param error The error to convert
 * @param defaultMessage Default message if the error doesn't have one
 * @returns A PaymentError
 */
export function toPaymentError(error: unknown, defaultMessage = "An unknown error occurred"): PaymentError {
    if (error instanceof PaymentError) {
        return error;
    }

    if (error instanceof Error) {
        return new PaymentError(error.message || defaultMessage, { cause: error });
    }

    if (typeof error === 'string') {
        return new PaymentError(error);
    }

    return new PaymentError(defaultMessage, {
        details: typeof error === 'object' && error !== null ? { originalError: error } : undefined,
    })
}
