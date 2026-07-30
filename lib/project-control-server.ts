const DEFAULT_BASE_URL = "https://website-auto-builder.vercel.app";

export function getProjectControlBaseUrl() {
  return (process.env.PROJECT_CONTROL_API_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, "");
}

export function getProjectControlApiKey() {
  const apiKey = process.env.PROJECT_CONTROL_API_KEY;

  if (!apiKey) {
    throw new Error("Missing PROJECT_CONTROL_API_KEY environment variable.");
  }

  return apiKey;
}

export function buildUpstreamProjectControlUrl(pathSegments: string[], searchParams?: URLSearchParams) {
  const path = pathSegments.map((segment) => encodeURIComponent(segment)).join("/");
  const url = new URL(`${getProjectControlBaseUrl()}/api/${path}`);

  if (searchParams) {
    url.search = searchParams.toString();
  }

  return url;
}

export type ProjectControlRequestInit = Omit<RequestInit, "body"> & {
  body?: string;
  searchParams?: URLSearchParams;
};

export async function projectControlRequest(pathSegments: string[], init: ProjectControlRequestInit = {}) {
  const { body, headers, method = "GET", searchParams } = init;
  const upstreamUrl = buildUpstreamProjectControlUrl(pathSegments, searchParams);
  const requestHeaders = new Headers(headers);

  requestHeaders.set("x-api-key", getProjectControlApiKey());

  if (typeof body === "string" && body.length > 0 && !requestHeaders.has("content-type")) {
    requestHeaders.set("content-type", "application/json");
  }

  const response = await fetch(upstreamUrl, {
    method,
    headers: requestHeaders,
    body: body && body.length > 0 ? body : undefined
  });

  const responseContentType = response.headers.get("content-type") || "";
  const responseText = await response.text();

  return {
    response,
    responseContentType,
    responseText
  };
}
