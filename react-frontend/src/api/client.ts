import type {
  Advocate,
  CaseDetail,
  CaseListItem,
  HearingUpdatePayload,
  NewCasePayload,
} from "../types";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || "http://localhost:8000";

export class ApiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.status = status;
  }
}

interface Token {
  access_token: string;
  token_type: string;
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null,
): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const resp = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });

  if (!resp.ok) {
    let detail = resp.statusText;
    try {
      const body = await resp.json();
      detail = body.detail ?? detail;
    } catch {
      // response wasn't JSON; fall back to statusText
    }
    throw new ApiError(typeof detail === "string" ? detail : JSON.stringify(detail), resp.status);
  }

  if (resp.status === 204) return undefined as T;
  return (await resp.json()) as T;
}

function jsonHeaders() {
  return { "Content-Type": "application/json" };
}

export function signup(fullName: string, email: string, password: string): Promise<Advocate> {
  return request<Advocate>("/auth/signup", {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({ full_name: fullName, email, password }),
  });
}

export function login(email: string, password: string): Promise<Token> {
  const form = new URLSearchParams();
  form.set("username", email);
  form.set("password", password);
  return request<Token>("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });
}

export function listCases(token: string): Promise<CaseListItem[]> {
  return request<CaseListItem[]>("/cases", {}, token);
}

export function createCase(token: string, payload: NewCasePayload): Promise<CaseDetail> {
  return request<CaseDetail>(
    "/cases",
    { method: "POST", headers: jsonHeaders(), body: JSON.stringify(payload) },
    token,
  );
}

export function getCase(token: string, caseId: number): Promise<CaseDetail> {
  return request<CaseDetail>(`/cases/${caseId}`, {}, token);
}

export function deleteCase(token: string, caseId: number): Promise<void> {
  return request<void>(`/cases/${caseId}`, { method: "DELETE" }, token);
}

export function updateHearing(
  token: string,
  caseId: number,
  payload: HearingUpdatePayload,
): Promise<CaseDetail> {
  return request<CaseDetail>(
    `/cases/${caseId}/hearings/update`,
    { method: "POST", headers: jsonHeaders(), body: JSON.stringify(payload) },
    token,
  );
}

export function rollbackHearing(token: string, caseId: number): Promise<CaseDetail> {
  return request<CaseDetail>(`/cases/${caseId}/hearings/rollback`, { method: "POST" }, token);
}
