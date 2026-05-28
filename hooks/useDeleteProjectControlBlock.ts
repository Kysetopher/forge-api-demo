"use client";

import { useCallback } from "react";
import { projectControlRequest } from "@/hooks/project-control-request";
import type { ProjectControlProject, ProjectControlSuccess } from "@/lib/project-control-types";

export function useDeleteProjectControlBlock() {
  return useCallback(
    (slug: string, instanceId: string) =>
      projectControlRequest<ProjectControlSuccess<{ project: ProjectControlProject }>>(
        `/projects/${encodeURIComponent(slug)}/blocks/${encodeURIComponent(instanceId)}`,
        { method: "DELETE" }
      ),
    []
  );
}

