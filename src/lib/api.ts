// Centralized API client with JWT auth
const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  pagination?: any;
  error?: string;
}

const TOKEN_KEY = "liquidity_auth_token";

export const tokenStore = {
  get(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TOKEN_KEY);
  },
  set(token: string) {
    if (typeof window === "undefined") return;
    localStorage.setItem(TOKEN_KEY, token);
  },
  remove() {
    if (typeof window === "undefined") return;
    localStorage.removeItem(TOKEN_KEY);
  },
};

async function request<T = any>(
  path: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  const token = tokenStore.get();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const url = `${API_URL}${path}`;

  console.log("Calling URL:", url);

  const res = await fetch(url, { ...options, headers });

  let json: ApiResponse<T>;
  try {
    json = await res.json();
  } catch {
    json = { success: false, message: "Invalid server response" };
  }

  if (res.status === 401 && typeof window !== "undefined") {
    tokenStore.remove();
    if (!window.location.pathname.startsWith("/login")) {
      window.location.href = "/login";
    }
  }

  return json;
}

export const api = {
  get: <T = any>(path: string) => request<T>(path, { method: "GET" }),
  post: <T = any>(path: string, body?: any) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body ?? {}) }),
  put: <T = any>(path: string, body?: any) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(body ?? {}) }),
  patch: <T = any>(path: string, body?: any) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body ?? {}) }),
  delete: <T = any>(path: string) => request<T>(path, { method: "DELETE" }),
};

export function buildQuery(params: Record<string, any> = {}) {
  const q = Object.entries(params)
    .filter(([_, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join("&");
  return q ? `?${q}` : "";
}

export const API_BASE = API_URL;
