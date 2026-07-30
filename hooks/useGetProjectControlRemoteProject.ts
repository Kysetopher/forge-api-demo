"use client";

import { useCallback } from "react";
import { projectControlRequest } from "@/hooks/project-control-request";
import type {
  ProjectControlRemoteProjectSnapshot,
  ProjectControlSuccess
} from "@/lib/project-control-types";

export function useGetProjectControlRemoteProject() {
  return useCallback(
    (slug: string) =>
      projectControlRequest<ProjectControlSuccess<ProjectControlRemoteProjectSnapshot>>(
        `/remote/projects/${encodeURIComponent(slug)}`,
        { method: "GET" }
      ),
    []
  );
}
