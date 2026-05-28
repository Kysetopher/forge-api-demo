"use client";

import { useCallback } from "react";
import { projectControlRequest } from "@/hooks/project-control-request";

export function useGetProjectControlRunStatus() {
  return useCallback(
    (slug: string) =>
      projectControlRequest<{ isRunning: boolean; url: string | null; port: number | null }>(
        `/projects/${encodeURIComponent(slug)}/run`,
        { method: "GET" }
      ),
    []
  );
}

