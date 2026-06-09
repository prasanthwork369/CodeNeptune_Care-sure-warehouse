import { AxiosError } from 'axios';

export type AppErrorKind =
  | 'network'
  | 'timeout'
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'validation'
  | 'server'
  | 'unknown';

export class AppError extends Error {
  kind: AppErrorKind;
  status?: number;
  data?: unknown;

  constructor(kind: AppErrorKind, message: string, status?: number, data?: unknown) {
    super(message);
    this.name = 'AppError';
    this.kind = kind;
    this.status = status;
    this.data = data;
  }
}

export function toAppError(err: unknown): AppError {
  if (err instanceof AppError) return err;

  if (isAxiosError(err)) {
    if (err.code === 'ECONNABORTED') {
      return new AppError('timeout', 'Request timed out');
    }
    if (!err.response) {
      return new AppError('network', 'Network unavailable');
    }
    const status = err.response.status;
    const data = err.response.data as { message?: string } | undefined;
    const message = data?.message ?? err.message;

    if (status === 401) return new AppError('unauthorized', message, status, data);
    if (status === 403) return new AppError('forbidden', message, status, data);
    if (status === 404) return new AppError('not_found', message, status, data);
    if (status === 422) return new AppError('validation', message, status, data);
    if (status >= 500) return new AppError('server', message, status, data);
    return new AppError('unknown', message, status, data);
  }

  if (err instanceof Error) {
    return new AppError('unknown', err.message);
  }
  return new AppError('unknown', 'Something went wrong');
}

function isAxiosError(err: unknown): err is AxiosError {
  return (
    typeof err === 'object' &&
    err !== null &&
    (err as { isAxiosError?: boolean }).isAxiosError === true
  );
}
