// Unified Error Handling Utilities
// Provides consistent error handling patterns across the application

export class GameError extends Error {
  public readonly context: string;
  public readonly originalError?: unknown;
  public readonly timestamp: number;

  constructor(message: string, options?: { context?: string; cause?: unknown }) {
    super(message);
    this.name = 'GameError';
    this.context = options?.context || 'Unknown';
    this.originalError = options?.cause;
    this.timestamp = Date.now();
  }
}

export class FlowError extends GameError {
  constructor(message: string, options?: { context?: string; cause?: unknown }) {
    super(message, { context: options?.context || 'Flow Blockchain', cause: options?.cause });
    this.name = 'FlowError';
  }
}

export class VRFError extends GameError {
  constructor(message: string, options?: { context?: string; cause?: unknown }) {
    super(message, { context: options?.context || 'VRF Service', cause: options?.cause });
    this.name = 'VRFError';
  }
}

export class AuthError extends GameError {
  constructor(message: string, options?: { context?: string; cause?: unknown }) {
    super(message, { context: options?.context || 'Authentication', cause: options?.cause });
    this.name = 'AuthError';
  }
}

export class GameSessionError extends GameError {
  constructor(message: string, options?: { context?: string; cause?: unknown }) {
    super(message, { context: options?.context || 'Game Session', cause: options?.cause });
    this.name = 'GameSessionError';
  }
}

/**
 * Create a standardized game error with context
 */
export function createGameError(context: string, error: unknown): GameError {
  const message = error instanceof Error ? error.message : String(error);
  return new GameError(`${context}: ${message}`, { context, cause: error });
}

/**
 * Create a Flow blockchain specific error
 */
export function createFlowError(context: string, error: unknown): FlowError {
  const message = error instanceof Error ? error.message : String(error);
  return new FlowError(`Flow ${context}: ${message}`, { context, cause: error });
}

/**
 * Create a VRF specific error
 */
export function createVRFError(context: string, error: unknown): VRFError {
  const message = error instanceof Error ? error.message : String(error);
  return new VRFError(`VRF ${context}: ${message}`, { context, cause: error });
}

/**
 * Create an authentication specific error
 */
export function createAuthError(context: string, error: unknown): AuthError {
  const message = error instanceof Error ? error.message : String(error);
  return new AuthError(`Auth ${context}: ${message}`, { context, cause: error });
}

/**
 * Create a game session specific error
 */
export function createGameSessionError(context: string, error: unknown): GameSessionError {
  const message = error instanceof Error ? error.message : String(error);
  return new GameSessionError(`Game ${context}: ${message}`, { context, cause: error });
}

/**
 * Safe error message extraction
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unknown error occurred';
}

/**
 * Log error with context and structured data
 */
export function logError(error: unknown, context?: string, additionalData?: Record<string, any>): void {
  const errorData = {
    message: getErrorMessage(error),
    context: context || 'Unknown',
    timestamp: new Date().toISOString(),
    stack: error instanceof Error ? error.stack : undefined,
    ...additionalData
  };

  console.error('Game Error:', errorData);

  // In production, you might want to send this to an error tracking service
  // Example: Sentry.captureException(error, { extra: errorData });
}

/**
 * Async error wrapper for consistent error handling
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context: string,
  errorType: 'game' | 'flow' | 'vrf' | 'auth' | 'session' = 'game'
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    logError(error, context);

    switch (errorType) {
      case 'flow':
        throw createFlowError(context, error);
      case 'vrf':
        throw createVRFError(context, error);
      case 'auth':
        throw createAuthError(context, error);
      case 'session':
        throw createGameSessionError(context, error);
      default:
        throw createGameError(context, error);
    }
  }
}

/**
 * Retry wrapper with exponential backoff
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  context: string,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (attempt === maxRetries) {
        logError(error, `${context} (final attempt ${attempt}/${maxRetries})`);
        break;
      }

      const delay = baseDelay * Math.pow(2, attempt - 1);
      logError(error, `${context} (attempt ${attempt}/${maxRetries}, retrying in ${delay}ms)`);

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw createGameError(`${context} failed after ${maxRetries} attempts`, lastError);
}

/**
 * Type guard for game errors
 */
export function isGameError(error: unknown): error is GameError {
  return error instanceof GameError;
}

/**
 * Type guard for Flow errors
 */
export function isFlowError(error: unknown): error is FlowError {
  return error instanceof FlowError;
}

/**
 * Type guard for VRF errors
 */
export function isVRFError(error: unknown): error is VRFError {
  return error instanceof VRFError;
}

/**
 * Type guard for Auth errors
 */
export function isAuthError(error: unknown): error is AuthError {
  return error instanceof AuthError;
}

/**
 * Error boundary helper for React components
 */
export function getErrorBoundaryMessage(error: unknown): string {
  if (isFlowError(error)) {
    return 'There was an issue with the blockchain connection. Please try again.';
  }
  if (isVRFError(error)) {
    return 'There was an issue generating random numbers. Please try again.';
  }
  if (isAuthError(error)) {
    return 'Authentication failed. Please sign in again.';
  }
  if (isGameError(error)) {
    return 'A game error occurred. Please try again.';
  }
  return 'An unexpected error occurred. Please refresh the page.';
}
