/**
 * Centralized API client.
 *
 * Real (HTTP) calls and mock calls both flow through this single layer
 * so swapping in the Flask backend means flipping `VITE_USE_MOCKS=false`
 * and the rest of the app stays untouched.
 */
import type { ApiSuccess, ApiError } from "./types";

const USE_MOCKS =
  (import.meta.env.VITE_USE_MOCKS ?? "true") !== "false";
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";

export class ApiClientError extends Error {
  code: string;
  status: number;
  details?: Record<string, unknown>;
  constructor(error: ApiError, status: number) {
    super(error.message);
    this.code = error.code;
    this.status = status;
    this.details = error.details;
  }
}

type Method = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

export interface RequestOptions {
  method?: Method;
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  signal?: AbortSignal;
}

type MockHandler = (opts: {
  path: string;
  method: Method;
  body?: unknown;
  query: Record<string, string | undefined>;
  pathParams: Record<string, string>;
}) => Promise<unknown>;

interface RegisteredRoute {
  method: Method;
  pattern: RegExp;
  keys: string[];
  handler: MockHandler;
}

const mockRoutes: RegisteredRoute[] = [];

export function registerMock(method: Method, path: string, handler: MockHandler) {
  const keys: string[] = [];
  const pattern = new RegExp(
    "^" +
      path.replace(/\/:([a-zA-Z_]+)/g, (_, k) => {
        keys.push(k);
        return "/([^/]+)";
      }) +
      "$",
  );
  mockRoutes.push({ method, pattern, keys, handler });
}

function authHeader(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = window.localStorage.getItem("dealio.accessToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function buildQs(query?: RequestOptions["query"]): string {
  if (!query) return "";
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === null || v === "") continue;
    usp.set(k, String(v));
  }
  const s = usp.toString();
  return s ? `?${s}` : "";
}

async function mockFetch<T>(path: string, opts: RequestOptions): Promise<T> {
  const method = opts.method ?? "GET";
  const queryRaw: Record<string, string | undefined> = {};
  if (opts.query) {
    for (const [k, v] of Object.entries(opts.query)) {
      queryRaw[k] = v == null ? undefined : String(v);
    }
  }
  for (const route of mockRoutes) {
    if (route.method !== method) continue;
    const m = route.pattern.exec(path);
    if (!m) continue;
    const pathParams: Record<string, string> = {};
    route.keys.forEach((k, i) => (pathParams[k] = decodeURIComponent(m[i + 1] ?? "")));
    // Simulate latency
    await new Promise((r) => setTimeout(r, 120 + Math.random() * 180));
    try {
      const result = await route.handler({
        path,
        method,
        body: opts.body,
        query: queryRaw,
        pathParams,
      });
      return result as T;
    } catch (err) {
      if (err instanceof ApiClientError) throw err;
      throw new ApiClientError(
        {
          code: "MOCK_HANDLER_ERROR",
          message: err instanceof Error ? err.message : "Mock handler failed",
        },
        500,
      );
    }
  }
  throw new ApiClientError(
    { code: "NOT_FOUND", message: `No mock route for ${method} ${path}` },
    404,
  );
}

async function httpFetch<T>(path: string, opts: RequestOptions): Promise<T> {
  const qs = buildQs(opts.query);
  const res = await fetch(`${BASE_URL}${path}${qs}`, {
    method: opts.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...authHeader(),
    },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    signal: opts.signal,
    credentials: "include",
  });
  const json = (await res.json().catch(() => ({}))) as
    | ApiSuccess<T>
    | { error: ApiError };
  if (!res.ok || "error" in json) {
    const e = "error" in json ? json.error : { code: "HTTP_ERROR", message: res.statusText };
    throw new ApiClientError(e, res.status);
  }
  return (json as ApiSuccess<T>).data;
}

export async function apiRequest<T>(
  path: string,
  opts: RequestOptions = {},
): Promise<T> {
  if (USE_MOCKS) {
    const result = await mockFetch<ApiSuccess<T>>(path, opts);
    return (result as ApiSuccess<T>).data;
  }
  return httpFetch<T>(path, opts);
}

export const apiInfo = { USE_MOCKS, BASE_URL };