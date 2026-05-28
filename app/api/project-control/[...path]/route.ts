import { NextRequest, NextResponse } from "next/server";
import { projectControlRequest } from "@/lib/project-control-server";

type RouteContext = {
  params: {
    path: string[];
  };
};

async function proxyRequest(request: NextRequest, { params }: RouteContext) {
  try {
    const body = request.method === "GET" || request.method === "HEAD" ? undefined : await request.text();
    const { response: upstreamResponse, responseContentType, responseText } = await projectControlRequest(
      params.path,
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
            error: responseText || "Project control proxy returned invalid JSON."
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
    const message = error instanceof Error ? error.message : "Project control proxy request failed.";

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
  return proxyRequest(request, context);
}

export function POST(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context);
}

export function PATCH(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context);
}

export function DELETE(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context);
}
