export interface ApiErrorDetail {
  field: string;
  message: string;
}

class ApiError extends Error {
  statusCode: number;
  data: null;
  success: boolean;
  errors: Array<string | ApiErrorDetail>;
  message: string;
  code: string;
  constructor(
    statusCode: number,
    code = "",
    message = "Something went wrong",
    errors: Array<string | ApiErrorDetail> = [],
    stack = ""
  ) {
    super(message);
    this.statusCode = statusCode;
    this.data = null;
    this.success = false;
    this.errors = errors;
    this.code = code;
    this.message = message;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export { ApiError };
