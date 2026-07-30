"use client";

import { useEffect, useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, useAccordionItemOpen } from "@/components/ui/accordion";
import { PageStructureEditor } from "@/components/ui/page-structure-editor";
import { useGetProjectControlProjects } from "@/hooks/useGetProjectControlProjects";
import { useGetProjectControlRemoteProject } from "@/hooks/useGetProjectControlRemoteProject";
import { usePatchProjectControlRemoteProject } from "@/hooks/usePatchProjectControlRemoteProject";
import type { ProjectControlBlock, ProjectControlProject } from "@/lib/project-control-types";

function ProjectStructurePanel({ slug }: { slug: string }) {
  const open = useAccordionItemOpen();
  const getRemoteProject = useGetProjectControlRemoteProject();
  const patchRemoteProject = usePatchProjectControlRemoteProject();
  const [draftStructure, setDraftStructure] = useState<ProjectControlBlock[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  async function loadPageStructure() {
    setIsLoading(true);
    setError(null);
    setSaveError(null);

    try {
      const response = await getRemoteProject(slug);
      setDraftStructure(response.pageStructure);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to load page structure.");
      setDraftStructure(null);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (!open) {
      return;
    }

    let active = true;

    async function run() {
      setIsLoading(true);
      setError(null);
      setSaveError(null);

      try {
        const response = await getRemoteProject(slug);

        if (!active) {
          return;
        }

        setDraftStructure(response.pageStructure);
      } catch (requestError) {
        if (!active) {
          return;
        }

        setError(requestError instanceof Error ? requestError.message : "Failed to load page structure.");
        setDraftStructure(null);
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    run();

    return () => {
      active = false;
    };
  }, [getRemoteProject, open, slug]);

  async function handleSave() {
    if (!draftStructure) {
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setError(null);

    try {
      const response = await patchRemoteProject(slug, draftStructure);
      setDraftStructure(response.pageStructure);
    } catch (requestError) {
      setSaveError(requestError instanceof Error ? requestError.message : "Failed to save page structure.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleRefresh() {
    await loadPageStructure();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Page Structure</h3>
          <p className="mt-1 text-xs text-slate-500">
            {isLoading
              ? "Loading structure..."
              : draftStructure
                ? `${draftStructure.length} block${draftStructure.length === 1 ? "" : "s"}`
                : "Ready to load"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isLoading || isSaving}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Refresh
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isLoading || isSaving || !draftStructure}
            className="rounded-full border border-sky-400/30 bg-sky-400/10 px-3 py-2 text-xs font-medium text-sky-100 transition hover:bg-sky-400/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      {saveError ? (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          {saveError}
        </div>
      ) : null}

      {isLoading ? (
        <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
          Fetching remote page structure...
        </div>
      ) : draftStructure ? (
        <PageStructureEditor blocks={draftStructure} onChange={setDraftStructure} />
      ) : (
        <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
          No blocks found in the remote page structure.
        </div>
      )}
    </div>
  );
}

function ProjectAccordionSummary({ project }: { project: ProjectControlProject }) {
  return (
    <span className="ui-accordion-trigger-title">
      <span className="ui-accordion-trigger-name">{project.name}</span>
      <span className="ui-accordion-trigger-meta">
        <span>Slug: {project.slug}</span>
        <span>Status: {project.status}</span>
        <span>Updated: {new Date(project.updatedAt).toLocaleString()}</span>
      </span>
    </span>
  );
}

function ProjectAccordionItem({ project }: { project: ProjectControlProject }) {
  return (
    <AccordionItem value={project.slug}>
      <AccordionTrigger>
        <ProjectAccordionSummary project={project} />
      </AccordionTrigger>
      <AccordionContent>
        <div className="mb-4 grid gap-3 text-xs text-slate-400 sm:grid-cols-2 xl:grid-cols-3">
          <div>
            <p className="uppercase tracking-[0.18em] text-slate-500">Local Path</p>
            <p className="mt-1 break-all text-slate-200">{project.localPath}</p>
          </div>
          <div>
            <p className="uppercase tracking-[0.18em] text-slate-500">Deployment</p>
            <p className="mt-1 text-slate-200">
              {project.deploymentUrl ? (
                <a
                  className="text-sky-300 underline decoration-sky-300/40 underline-offset-4 hover:text-sky-200"
                  href={project.deploymentUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open deployment
                </a>
              ) : (
                "No deployment URL"
              )}
            </p>
          </div>
          <div>
            <p className="uppercase tracking-[0.18em] text-slate-500">GitHub</p>
            <p className="mt-1 break-all text-slate-200">{project.githubUrl || "No GitHub URL"}</p>
          </div>
        </div>

        <ProjectStructurePanel slug={project.slug} />
      </AccordionContent>
    </AccordionItem>
  );
}

export function ProjectsTable() {
  const getProjects = useGetProjectControlProjects();
  const [projects, setProjects] = useState<ProjectControlProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadProjects() {
      try {
        const response = await getProjects();

        if (!active) {
          return;
        }

        setProjects(response.projects);
      } catch (requestError) {
        if (!active) {
          return;
        }

        setError(requestError instanceof Error ? requestError.message : "Failed to load projects.");
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    loadProjects();

    return () => {
      active = false;
    };
  }, [getProjects]);

  return (
    <section className="mx-auto w-full max-w-7xl">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Project Control</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">Projects</h1>
        </div>
        <p className="text-sm text-slate-400">
          {isLoading ? "Loading..." : `${projects.length} project${projects.length === 1 ? "" : "s"}`}
        </p>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-6 text-sm text-rose-200">
          {error}
        </div>
      ) : isLoading ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-slate-300 shadow-2xl backdrop-blur">
          Loading projects...
        </div>
      ) : projects.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-slate-300 shadow-2xl backdrop-blur">
          No projects found.
        </div>
      ) : (
        <Accordion type="multiple" className="space-y-4">
          {projects.map((project) => (
            <ProjectAccordionItem key={project.id} project={project} />
          ))}
        </Accordion>
      )}
    </section>
  );
}
