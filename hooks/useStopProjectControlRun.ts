"use client";

import { useCallback } from "react";
import { projectControlRequest } from "@/hooks/project-control-request";
import type { ProjectControlSuccess } from "@/lib/project-control-types";

export function useStopProjectControlRun() {
  return useCallback(
    (slug: string) => projectControlRequest<ProjectControlSuccess>(`/projects/${encodeURIComponent(slug)}/run`, { method: "DELETE" }),
    []
  );
}

