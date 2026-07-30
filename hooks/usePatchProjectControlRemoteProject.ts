"use client";

import { useCallback } from "react";
import { projectControlRequest } from "@/hooks/project-control-request";
import type { ProjectControlBlock, ProjectControlRemoteProjectSnapshot, ProjectControlSuccess } from "@/lib/project-control-types";

export function usePatchProjectControlRemoteProject() {
  return useCallback(
    (slug: string, pageStructure: ProjectControlBlock[]) =>
      projectControlRequest<ProjectControlSuccess<ProjectControlRemoteProjectSnapshot>>(
        `/remote/projects/${encodeURIComponent(slug)}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            pageStructure,
            blueprint: {
              blocks: pageStructure
            }
          })
        }
      ),
    []
  );
}
