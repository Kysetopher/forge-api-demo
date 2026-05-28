"use client";

import { useCallback } from "react";
import { projectControlRequest } from "@/hooks/project-control-request";
import type { ProjectControlBlock, ProjectControlProject, ProjectControlSuccess } from "@/lib/project-control-types";

type ReplaceBlockInput = {
  instanceId?: string;
  targetInstanceId?: string;
  replaceInstanceId?: string;
  block?: ProjectControlBlock;
  replacement?: ProjectControlBlock;
  nextBlock?: ProjectControlBlock;
};

export function useReplaceProjectControlBlock() {
  return useCallback(
    (slug: string, input: ReplaceBlockInput) =>
      projectControlRequest<ProjectControlSuccess<{ block: ProjectControlBlock; project: ProjectControlProject }>>(
        `/projects/${encodeURIComponent(slug)}/blocks/replace`,
        { method: "POST", body: JSON.stringify(input) }
      ),
    []
  );
}

