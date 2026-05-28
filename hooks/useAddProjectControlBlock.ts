"use client";

import { useCallback } from "react";
import { projectControlRequest } from "@/hooks/project-control-request";
import type { ProjectControlBlock, ProjectControlProject, ProjectControlSuccess } from "@/lib/project-control-types";

type AddBlockInput = {
  block?: ProjectControlBlock;
  blocks?: ProjectControlBlock[];
  index?: number;
  position?: number;
};

export function useAddProjectControlBlock() {
  return useCallback(
    (slug: string, input: AddBlockInput) =>
      projectControlRequest<ProjectControlSuccess<{ block: ProjectControlBlock; project: ProjectControlProject }>>(
        `/projects/${encodeURIComponent(slug)}/blocks/add`,
        { method: "POST", body: JSON.stringify(input) }
      ),
    []
  );
}

