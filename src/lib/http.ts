/**
 * Cliente HTTP para as rotas internas (/data/*). Mesma origem: a sessao vai
 * pelo cookie; o token CSRF e enviado no header nas operacoes de escrita.
 */
export class ApiError extends Error {
  status: number;
  details?: Record<string, string>;
  constructor(status: number, message: string, details?: Record<string, string>) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

let csrfToken: string | null = null;
export function setCsrfToken(token: string | null) {
  csrfToken = token;
}

interface Options {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  formData?: FormData;
}

export async function api<T>(path: string, opts: Options = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  let body: BodyInit | undefined;

  if (opts.formData) {
    body = opts.formData;
  } else if (opts.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(opts.body);
  }
  if (csrfToken && opts.method && opts.method !== "GET") {
    headers["X-CSRF-Token"] = csrfToken;
  }

  const res = await fetch(path, {
    method: opts.method ?? "GET",
    headers,
    body,
    credentials: "same-origin",
  });

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    throw new ApiError(res.status, "Resposta inválida do servidor.");
  }

  if (!res.ok) {
    const err = (data ?? {}) as { error?: string; details?: Record<string, string> };
    throw new ApiError(res.status, err.error ?? `Erro ${res.status}`, err.details);
  }
  return data as T;
}
