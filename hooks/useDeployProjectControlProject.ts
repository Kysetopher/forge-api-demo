"use client";

import { useCallback } from "react";
import { projectControlRequest } from "@/hooks/project-control-request";
import type { ProjectControlSuccess } from "@/lib/project-control-types";

export function useDeployProjectControlProject() {
  return useCallback(
    (slug: string) =>
      projectControlRequest<
        ProjectControlSuccess<{ deploymentUrl: string; projectUrl: string; projectStatus: string }>
      >(`/projects/${encodeURIComponent(slug)}/deploy`, { method: "POST" }),
    []
  );
}

