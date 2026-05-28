"use client";

import { useCallback } from "react";
import { projectControlRequest } from "@/hooks/project-control-request";
import type { ProjectControlProject, ProjectControlSuccess } from "@/lib/project-control-types";

export function useGetProjectControlProjects() {
  return useCallback(
    () => projectControlRequest<ProjectControlSuccess<{ projects: ProjectControlProject[] }>>("/projects", { method: "GET" }),
    []
  );
}

