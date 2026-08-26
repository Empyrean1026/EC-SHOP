export type ApiError = {
  code: string;
  message: string;
  details?: Record<string, string[]>;
};

export type ApiResponse<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: ApiError;
    };
