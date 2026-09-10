// Central error type. Every error the API returns is (or gets converted to)
// one of these by middleware/errorHandler.ts, guaranteeing the response
// shape documented in docs/02-architecture/API_DESIGN.md#error-shape.

export type ApiErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "NOT_FOUND"
  | "CONFLICT"
  | "VALIDATION_ERROR"
  | "UPSTREAM_ERROR"
  | "INTERNAL_ERROR";

const STATUS_BY_CODE: Record<ApiErrorCode, number> = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  NOT_FOUND: 404,
  CONFLICT: 409,
  VALIDATION_ERROR: 422,
  UPSTREAM_ERROR: 502,
  INTERNAL_ERROR: 500,
};

export interface ApiErrorDetail {
  field: string;
  issue: string;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: ApiErrorCode;
  readonly details?: ApiErrorDetail[];

  constructor(code: ApiErrorCode, message: string, details?: ApiErrorDetail[]) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = STATUS_BY_CODE[code];
    this.details = details;
  }
}
