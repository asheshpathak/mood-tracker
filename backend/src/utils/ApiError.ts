export type ApiErrorDetails = Record<string, string[]> | undefined;

export class ApiError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly details: ApiErrorDetails;
  readonly expose: boolean;

  constructor(
    statusCode: number,
    message: string,
    options: { code?: string; details?: ApiErrorDetails; cause?: unknown } = {},
  ) {
    super(message, { cause: options.cause });
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = options.code ?? defaultCodeFor(statusCode);
    this.details = options.details;
    this.expose = statusCode < 500;
    Error.captureStackTrace?.(this, ApiError);
  }

  static badRequest(message = 'Bad request', details?: ApiErrorDetails) {
    return new ApiError(400, message, { code: 'BAD_REQUEST', details });
  }
  static unauthorized(message = 'Not authenticated') {
    return new ApiError(401, message, { code: 'UNAUTHORIZED' });
  }
  static forbidden(message = 'Not allowed') {
    return new ApiError(403, message, { code: 'FORBIDDEN' });
  }
  static notFound(message = 'Not found') {
    return new ApiError(404, message, { code: 'NOT_FOUND' });
  }
  static conflict(message = 'Already exists') {
    return new ApiError(409, message, { code: 'CONFLICT' });
  }
  static tooMany(message = 'Too many requests') {
    return new ApiError(429, message, { code: 'RATE_LIMITED' });
  }
  static internal(message = 'Something went wrong', cause?: unknown) {
    return new ApiError(500, message, { code: 'INTERNAL_ERROR', cause });
  }
}

function defaultCodeFor(statusCode: number): string {
  if (statusCode >= 500) return 'INTERNAL_ERROR';
  if (statusCode === 404) return 'NOT_FOUND';
  if (statusCode === 403) return 'FORBIDDEN';
  if (statusCode === 401) return 'UNAUTHORIZED';
  return 'BAD_REQUEST';
}
