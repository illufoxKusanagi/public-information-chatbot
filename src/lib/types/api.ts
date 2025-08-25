export interface ApiResponse<T = any> {
  data: T;
  message: string;
  status: "success" | "error";
}

export interface ApiError {
  message: string;
  code: number;
  details?: any;
}
