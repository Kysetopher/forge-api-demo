"use client";

import { useCallback } from "react";
import { projectControlRequest } from "@/hooks/project-control-request";
import type { ProjectControlSuccess } from "@/lib/project-control-types";

export function useRunProjectControlProject() {
  return useCallback(
    (slug: string) => projectControlRequest<ProjectControlSuccess<{ url: string }>>(`/projects/${encodeURIComponent(slug)}/run`, { method: "POST" }),
    []
  );
}

