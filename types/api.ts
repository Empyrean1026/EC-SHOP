export type ApiError = {
  success: false;
  message: string;
  code: string;
  details?: Record<string, string[]>;
  requestId?: string;
};

export type ApiResponse<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      message: string;
      code: string;
      details?: Record<string, string[]>;
      requestId?: string;
    };
