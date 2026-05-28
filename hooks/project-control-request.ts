"use client";

export async function projectControlRequest<T>(path: string, init?: RequestInit) {
  const headers = new Headers(init?.headers);

  if (init?.body !== undefined && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  const response = await fetch(`/api/project-control${path.startsWith("/") ? path : `/${path}`}`, {
    credentials: "same-origin",
    ...init,
    headers
  });
  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await response.json() : await response.text();

  if (!response.ok) {
    throw new Error(
      typeof payload === "object" && payload !== null && "error" in payload
        ? String((payload as { error: string }).error)
        : typeof payload === "string"
          ? payload
          : `Request failed with status ${response.status}.`
    );
  }

  if (typeof payload === "object" && payload !== null && "success" in payload && payload.success === false) {
    throw new Error(String((payload as { error: string }).error));
  }

  return payload as T;
}
