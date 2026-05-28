"use client";

import { useCallback } from "react";
import { projectControlRequest } from "@/hooks/project-control-request";
import type { ProjectControlGitStatus, ProjectControlProject, ProjectControlSuccess } from "@/lib/project-control-types";

export function useGetProjectControlProject() {
  return useCallback(
    (slug: string) =>
      projectControlRequest<ProjectControlSuccess<{ project: ProjectControlProject; gitStatus: ProjectControlGitStatus | null }>>(
        `/projects/${encodeURIComponent(slug)}`,
        { method: "GET" }
      ),
    []
  );
}

