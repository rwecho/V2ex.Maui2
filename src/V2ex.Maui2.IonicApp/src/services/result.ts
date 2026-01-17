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

  // ZodError is also an Error; check it first for better messaging.
  if (e instanceof z.ZodError) {
    const issues = e.issues ?? [];
    if (issues.length === 0) return fallback;

    const summarize = (issue: z.ZodIssue): string => {
      const path = issue.path?.length ? issue.path.join(".") : "";

      // Common case in this project: expected array but got object (often an error payload)
      if (issue.code === "invalid_type") {
        const expected = (issue as any)?.expected as unknown;
        if (expected === "array") {
          return "返回数据不是列表（可能是后端错误返回）";
        }
      }

      const base = issue.message || "数据格式不正确";
      return path ? `${base}（${path}）` : base;
    };

    // Avoid dumping huge issue arrays into UI.
    return issues.slice(0, 3).map(summarize).join("；");
  }

  if (e instanceof Error) return e.message || fallback;
  return fallback;
};
