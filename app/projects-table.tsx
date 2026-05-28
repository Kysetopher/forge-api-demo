"use client";

import { useEffect, useState } from "react";
import { useGetProjectControlProjects } from "@/hooks/useGetProjectControlProjects";
import type { ProjectControlProject } from "@/lib/project-control-types";

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

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur">
        {error ? (
          <div className="p-6 text-sm text-rose-200">{error}</div>
        ) : isLoading ? (
          <div className="p-6 text-sm text-slate-300">Loading projects...</div>
        ) : projects.length === 0 ? (
          <div className="p-6 text-sm text-slate-300">No projects found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10 text-left text-sm text-slate-200">
              <thead className="bg-white/5 text-xs uppercase tracking-[0.18em] text-slate-400">
                <tr>
                  <th className="px-5 py-4 font-medium">Name</th>
                  <th className="px-5 py-4 font-medium">Slug</th>
                  <th className="px-5 py-4 font-medium">Status</th>
                  <th className="px-5 py-4 font-medium">Updated</th>
                  <th className="px-5 py-4 font-medium">Local Path</th>
                  <th className="px-5 py-4 font-medium">Deployment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {projects.map((project) => (
                  <tr key={project.id} className="hover:bg-white/[0.03]">
                    <td className="px-5 py-4 font-medium text-white">{project.name}</td>
                    <td className="px-5 py-4 text-slate-300">{project.slug}</td>
                    <td className="px-5 py-4 text-slate-300">{project.status}</td>
                    <td className="px-5 py-4 text-slate-300">
                      {new Date(project.updatedAt).toLocaleString()}
                    </td>
                    <td className="px-5 py-4 text-slate-300">{project.localPath}</td>
                    <td className="px-5 py-4 text-slate-300">
                      {project.deploymentUrl ? (
                        <a
                          className="text-sky-300 underline decoration-sky-300/40 underline-offset-4 hover:text-sky-200"
                          href={project.deploymentUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open
                        </a>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
