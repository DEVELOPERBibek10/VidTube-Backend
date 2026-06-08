export interface ApiError extends Error {
  statusCode: number;
  code: string;
  errors?: string[];
  success: boolean;
  stack?: string;
}
