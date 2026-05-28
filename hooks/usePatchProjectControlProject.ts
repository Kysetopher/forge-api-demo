"use client";

import { useCallback } from "react";
import { projectControlRequest } from "@/hooks/project-control-request";
import type { ProjectControlBlueprint, ProjectControlSuccess } from "@/lib/project-control-types";

export function usePatchProjectControlProject() {
  return useCallback(
    (slug: string, blueprint: ProjectControlBlueprint) =>
      projectControlRequest<ProjectControlSuccess>(`/projects/${encodeURIComponent(slug)}`, {
        method: "PATCH",
        body: JSON.stringify({ blueprint })
      }),
    []
  );
}

