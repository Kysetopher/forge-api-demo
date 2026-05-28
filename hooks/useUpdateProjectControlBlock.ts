"use client";

import { useCallback } from "react";
import { projectControlRequest } from "@/hooks/project-control-request";
import type { ProjectControlBlock, ProjectControlProject, ProjectControlSuccess } from "@/lib/project-control-types";

type UpdateBlockInput = {
  block?: Partial<ProjectControlBlock>;
  updates?: Partial<ProjectControlBlock>;
};

export function useUpdateProjectControlBlock() {
  return useCallback(
    (slug: string, instanceId: string, input: UpdateBlockInput) =>
      projectControlRequest<ProjectControlSuccess<{ block: ProjectControlBlock; project: ProjectControlProject }>>(
        `/projects/${encodeURIComponent(slug)}/blocks/${encodeURIComponent(instanceId)}`,
        { method: "PATCH", body: JSON.stringify(input) }
      ),
    []
  );
}

