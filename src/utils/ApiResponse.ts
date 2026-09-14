class ApiResponse<T> {
  statusCode: number;
  data: T;
  message: string;
  success: boolean;
  code: string;
  constructor(
    statusCode: number,
    data: T,
    message = "Success",
    code = "SUCCESS"
  ) {
    this.statusCode = statusCode;
    this.code = code;
    this.data = data;
    this.message = message;
    this.success = true;
  }
}

export { ApiResponse };
