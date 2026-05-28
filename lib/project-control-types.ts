export type ProjectControlJson = Record<string, unknown>;

export interface ProjectControlBlock {
  id: string;
  instanceId?: string;
  variant?: string | null;
  splashId?: string | null;
  bgImage?: string | null;
  className?: string | null;
  [key: string]: unknown;
}

export interface ProjectControlBlueprint {
  blocks?: ProjectControlBlock[];
  [key: string]: unknown;
}

export interface ProjectControlProject {
  id: string;
  name: string;
  slug: string;
  localPath: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  githubUrl?: string;
  deploymentUrl?: string;
  metadata: {
    blueprint?: ProjectControlBlueprint;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface ProjectControlGitStatus {
  hasChanges: boolean;
  hasUnpushedCommits: boolean;
  details?: string;
  error?: string;
}

export type ProjectControlSuccess<TData extends ProjectControlJson = ProjectControlJson> = {
  success: true;
} & TData;

export interface ProjectControlFailure {
  success: false;
  error: string;
}

export type ProjectControlMutationResponse<TData extends ProjectControlJson = ProjectControlJson> =
  ProjectControlSuccess<TData>;
