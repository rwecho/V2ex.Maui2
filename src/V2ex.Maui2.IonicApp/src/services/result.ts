import { z } from "zod";

/**
 * Result<T>
 *
 * - success: { data: T, error: null }
 * - failure: { data: null, error: string }
 *
 * 约定：调用方只需要判断 error 是否为 null。
 */
export type Result<T> =
  | { data: T; error: null }
  | { data: null; error: string };

export const ok = <T>(data: T): Result<T> => ({ data, error: null });
export const err = <T = never>(message: string): Result<T> => ({
  data: null,
  error: message,
});

export const isOk = <T>(r: Result<T>): r is { data: T; error: null } =>
  r.error === null;

export const isErr = <T>(r: Result<T>): r is { data: null; error: string } =>
  r.error !== null;

export const toErrorMessage = (
  e: unknown,
  fallback: string = "Unknown error"
): string => {
  if (typeof e === "string") return e;
  if (e instanceof Error) return e.message || fallback;
  if (e instanceof z.ZodError) return e.message || fallback;
  return fallback;
};
