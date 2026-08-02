export interface SuccessEnvelope<T> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}

export interface ErrorEnvelope {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export function ok<T>(
  data: T,
  meta?: Record<string, unknown>,
): SuccessEnvelope<T> {
  return { success: true, data, meta };
}

export function fail(
  code: string,
  message: string,
  details?: Record<string, unknown>,
): ErrorEnvelope {
  return { success: false, error: { code, message, details } };
}
