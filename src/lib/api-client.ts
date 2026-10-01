/**
 * Defensive fetch helpers.
 *
 * The preview proxy can serve an HTML page for an API path while the server rebuilds.
 * Every network call in the app goes through here so that scenario becomes a friendly error.
 */

export class ApiError extends Error {
  readonly status: number;
  readonly retryable: boolean;
  constructor(message: string, status = 0, retryable = false) {
    super(message); this.name = "ApiError"; this.status = status; this.retryable = retryable;
  }
}

export const SERVICE_BUSY = "The task service is restarting — retrying automatically…";
export const SERVICE_DOWN = "Can't reach the task service right now. Your data is safe — try again in a moment.";
const RETRYABLE_STATUS = new Set([429, 502, 503, 504]);

function isAbort(error: unknown): boolean {
  return error instanceof DOMException && (error.name === "AbortError" || error.name === "TimeoutError");
}
function looksLikeHtml(text: string): boolean {
  const head = text.trimStart().slice(0, 120).toLowerCase();
  return head.startsWith("<!doctype") || head.startsWith("<html");
}
function describeStatus(status: number): string {
  if (RETRYABLE_STATUS.has(status)) return SERVICE_BUSY;
  if (status >= 500) return SERVICE_DOWN;
  if (status === 404) return "That task no longer exists.";
  return "The server returned an unexpected response.";
}
function retryableStatus(status: number): boolean { return RETRYABLE_STATUS.has(status) || status >= 500; }

async function readPayload<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (looksLikeHtml(text)) throw new ApiError(describeStatus(response.status), response.status, retryableStatus(response.status));
  if (!text.trim()) {
    if (!response.ok) throw new ApiError(describeStatus(response.status), response.status, retryableStatus(response.status));
    throw new ApiError("The server returned an empty response.", response.status, false);
  }
  let parsed: unknown;
  try { parsed = JSON.parse(text); } catch {
    throw new ApiError(describeStatus(response.status), response.status, retryableStatus(response.status));
  }
  return parsed as T;
}

export interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  retries?: number;
}

export async function requestJson<T>(url: string, options: RequestOptions = {}): Promise<T> {
  const { retries = 2, body, headers, ...rest } = options;
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(url, {
        ...rest, cache: "no-store",
        headers: { ...(body === undefined ? {} : { "Content-Type": "application/json" }), Accept: "application/json", ...(headers ?? {}) },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      const payload = await readPayload<T>(response);
      if (!response.ok) {
        const serverMessage = (payload as { error?: unknown } | null)?.error;
        throw new ApiError(typeof serverMessage === "string" && serverMessage ? serverMessage : describeStatus(response.status), response.status, retryableStatus(response.status));
      }
      return payload;
    } catch (error) {
      lastError = error;
      if (isAbort(error)) throw error;
      const retryable = error instanceof ApiError ? error.retryable : error instanceof TypeError;
      if (!retryable || attempt === retries) break;
      await new Promise((resolve) => setTimeout(resolve, 350 * (attempt + 1)));
    }
  }
  if (lastError instanceof ApiError) throw lastError;
  if (isAbort(lastError)) throw lastError;
  throw new ApiError(SERVICE_DOWN, 0, true);
}

export function isAbortError(error: unknown): boolean { return isAbort(error); }
export function errorMessage(error: unknown, fallback = "Something went wrong. Please try again."): string {
  if (error instanceof ApiError) return error.message;
  if (isAbort(error)) return "";
  if (error instanceof TypeError) return SERVICE_DOWN;
  return fallback;
}