import { NextRequest, NextResponse } from "next/server";
import { projectControlRequest } from "@/lib/project-control-server";

type RouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

async function proxyRemoteSnapshot(request: NextRequest, { params }: RouteContext) {
  try {
    const resolvedParams = await params;
    const body = request.method === "GET" || request.method === "HEAD" ? undefined : await request.text();
    const { response: upstreamResponse, responseContentType, responseText } = await projectControlRequest(
      ["remote", "projects", resolvedParams.slug],
      {
        method: request.method,
        body,
        headers: request.headers.get("content-type")
          ? {
              "content-type": request.headers.get("content-type") as string
            }
          : undefined,
        searchParams: request.nextUrl.searchParams
      }
    );

    if (responseContentType.includes("application/json")) {
      try {
        return NextResponse.json(JSON.parse(responseText), {
          status: upstreamResponse.status,
          statusText: upstreamResponse.statusText
        });
      } catch {
        return NextResponse.json(
          {
            success: false,
            error: responseText || "Remote project snapshot proxy returned invalid JSON."
          },
          {
            status: upstreamResponse.status
          }
        );
      }
    }

    return new NextResponse(responseText, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: {
        "content-type": responseContentType || "text/plain; charset=utf-8"
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Remote project snapshot proxy request failed.";

    return NextResponse.json(
      {
        success: false,
        error: message
      },
      {
        status: 500
      }
    );
  }
}

export function GET(request: NextRequest, context: RouteContext) {
  return proxyRemoteSnapshot(request, context);
}

export function PATCH(request: NextRequest, context: RouteContext) {
  return proxyRemoteSnapshot(request, context);
}
