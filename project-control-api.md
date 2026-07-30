# Project Control API

This document explains how an external service should communicate with the Forge Console project-control endpoints.

## Base URL

The hosted Forge Console app lives at:

- `https://website-auto-builder.vercel.app/`

All project-control API requests are relative to that deployment:

- `/api/projects`
- `/api/projects/:slug`
- `/api/remote/projects/:slug`
- `/api/projects/:slug/push`
- `/api/projects/:slug/pull`
- `/api/projects/:slug/deploy`
- `/api/projects/:slug/run`
- `/api/projects/:slug/blocks/add`
- `/api/projects/:slug/blocks/:instanceId`
- `/api/projects/:slug/blocks/replace`
- `/api/remote/projects/:slug/push`
- `/api/remote/projects/:slug/pull`
- `/api/remote/projects/:slug/deploy`
- `/api/remote/projects/:slug/blocks/add`
- `/api/remote/projects/:slug/blocks/:instanceId`
- `/api/remote/projects/:slug/blocks/replace`

## Communication Rules

- Send `Content-Type: application/json` for JSON writes.
- Read `success` before assuming a request worked.
- Treat all mutation endpoints as JSON request/response endpoints.
- Use `project.metadata.blueprint.blocks` as the canonical homepage block array.
- Use `block.id` as the template selector and `instanceId` as the stable block instance identifier.
- All project-control routes require `x-api-key` as a header.

## Authentication

The project-control routes are key-only.

Send the secret API key on every request using this header:

- `x-api-key: <API_KEY>`


Example header:

```http
x-api-key: your-secret-key
```

## Suggested Workflow

Project creation happens outside this deployed API surface. This document covers the control-plane endpoints that read, mutate, push, deploy, run, and edit existing projects.

Project identity is GitHub-first:

- if the repository exists in the org, the project exists
- each repo carries its own committed manifest for durable metadata
- local-only repos are allowed during failed syncs, but they are treated as unsynced until they are pushed

Remote repository mutation is now split onto `/api/remote/*`:

- use `/api/remote/projects/:slug/*` when the caller should write directly to GitHub without needing a local checkout
- use `/api/projects/:slug/*` when the caller is operating on the desktop-local project workspace

Remote reads also live on the GitHub-backed surface:

- use `GET /api/remote/projects/:slug` to fetch the committed remote snapshot and page structure
- the snapshot exposes `pageStructure` derived from `project.metadata.blueprint.blocks`
- remote reads must not depend on `project.localPath`

### Existing project edit

1. Call `GET /api/projects/:slug`.
2. Read `project.metadata.blueprint`.
3. Update the relevant block(s).
4. Call `PATCH /api/projects/:slug`.
5. Call `POST /api/projects/:slug/push`.
6. Call `POST /api/projects/:slug/pull` when you need to clone a GitHub-only project locally.
7. Call `POST /api/projects/:slug/deploy`.
8. Use the dedicated block endpoints when you want a narrower mutation surface.

## Schema Reference

### `Project`

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | string | yes | Stable internal project id. |
| `name` | string | yes | Display name. |
| `slug` | string | yes | Filesystem and route slug. |
| `localPath` | string | yes | Absolute local project path. |
| `status` | string | yes | One of the project status values in `src/lib/types.ts`. |
| `createdAt` | string | yes | ISO timestamp. |
| `updatedAt` | string | yes | ISO timestamp. |
| `githubUrl` | string | no | GitHub repo URL when available. |
| `deploymentUrl` | string | no | Latest deployment URL when available. |
| `metadata` | object | yes | Open-ended project metadata, including the GitHub sync state and committed manifest payload. |

### `Project.metadata`

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `blueprint` | object | no | Homepage blueprint. |
| `sourceSiteUrl` | string | no | Original source-site URL when stored. |
| `githubRepoId` | string \| number | no | GitHub repo identifier. |
| `vercelId` | string | no | Vercel project id. |
| `vercelUrl` | string | no | Vercel project URL. |
| `vercelDeploymentId` | string | no | Latest deployment id. |
| `vercelDeploymentUrl` | string | no | Latest deployment URL. |
| `vercelDeploymentState` | string | no | Latest deployment state. |
| `vercelDeploymentErrorMessage` | string \| null | no | Latest Vercel deployment error. |
| `vercelDeploymentErrorCode` | string \| null | no | Latest Vercel deployment error code. |
| `github.syncState` | string | no | `synced` when the project repo exists on GitHub, `local-only` when the local repo has not been pushed yet. |
| `storage.state` | string | no | `local-only`, `github-only`, or `local-and-github` depending on whether the project is cloned locally, exists on GitHub, or both. |
| `storage.hasLocalCopy` | boolean | no | True when the local checkout exists on disk. |
| `storage.hasGithubCopy` | boolean | no | True when the GitHub repository exists. |
| any other key | any | no | Metadata is intentionally open-ended. |

### `Remote project snapshot`

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `project` | object | yes | GitHub-backed project snapshot. `localPath` is optional in this response shape. |
| `pageStructure` | array of `Block` | yes | Derived from `project.metadata.blueprint.blocks`. |

### `Blueprint`

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `blocks` | array of `Block` | no on read, yes for block editing | Canonical homepage block list. |
| any other key | any | no | Preserved when merging updates. |

### `Block`

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | string | yes | Template/component selector. |
| `instanceId` | string | no | Stable placed-block identifier. Generated if omitted on add. |
| `variant` | string \| null | no | Block variant. |
| `splashId` | string \| null | no | Background/splash asset key. |
| `bgImage` | string \| null | no | Background image URL or local path. |
| `className` | string \| null | no | Extra class override. |
| any other block key | any | no | Block payload is open-ended and preserved. |

### `Git Status`

| Field | Type | Notes |
| --- | --- | --- |
| `hasChanges` | boolean | True when the local repo has staged/unstaged/untracked changes. |
| `hasUnpushedCommits` | boolean | True when `git cherry -v` reports commits to push. |
| `details` | string | Raw porcelain output from `git status --porcelain`. |
| `error` | string | Present when git status cannot be read. |

## Endpoint Reference

### `GET /api/projects`

Returns all stored projects.

Parameters:

- none

Response:

- `success: true`
- `projects: Project[]`

Response example:

```json
{
  "success": true,
  "projects": [
    {
      "id": "project-id",
      "name": "Northstar Systems",
      "slug": "northstar-systems",
      "status": "live",
      "localPath": "C:/.../projects/northstar-systems",
      "metadata": {
        "blueprint": {}
      }
    }
  ]
}
```

### `GET /api/projects/:slug`

Returns one stored project and its current Git status when available.

Parameters:

| Name | In | Type | Required | Notes |
| --- | --- | --- | --- | --- |
| `slug` | path | string | yes | Project slug. |

Important:

- the homepage blocks are at `project.metadata.blueprint.blocks`
- the response includes `gitStatus` when the local project exists

Response:

- `success: true`
- `project: Project` with `metadata.blueprint` normalized
- `gitStatus: Git Status \| null`

Response example:

```json
{
  "success": true,
  "project": {
    "slug": "northstar-systems",
    "name": "Northstar Systems",
    "metadata": {
      "blueprint": {
        "blocks": []
      }
    }
  },
  "gitStatus": null
}
```

### `GET /api/remote/projects/:slug`

Returns the GitHub-backed project snapshot and page structure.

Parameters:

| Name | In | Type | Required | Notes |
| --- | --- | --- | --- | --- |
| `slug` | path | string | yes | Project slug. |

Important:

- `pageStructure` is the structured homepage block array returned by the remote service
- the response must work even when the project has never been cloned locally
- `project.localPath` may be omitted in the remote snapshot
- `storage` describes whether the project exists locally, on GitHub, or both

Response:

- `success: true`
- `project: Remote project snapshot`
- `pageStructure: Block[]`
- `storage: { state: string; hasLocalCopy: boolean; hasGithubCopy: boolean }`

Response example:

```json
{
  "success": true,
  "project": {
    "id": "project-id",
    "name": "Northstar Systems",
    "slug": "northstar-systems",
    "status": "live",
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-01-02T00:00:00.000Z",
    "metadata": {
      "blueprint": {
        "blocks": []
      }
    }
  },
  "pageStructure": [],
  "storage": {
    "state": "github-only",
    "hasLocalCopy": false,
    "hasGithubCopy": true
  }
}
```
### `PATCH /api/remote/projects/:slug`

Updates the remote GitHub-backed project snapshot.

Parameters:

| Name | In | Type | Required | Notes |
| --- | --- | --- | --- | --- |
| `slug` | path | string | yes | Project slug. |

Body:

| Name | Type | Required | Notes |
| --- | --- | --- | --- |
| `pageStructure` | array of `Block` | yes | The normalized homepage block array to persist. |
| `blueprint` | object | no | Optional compatibility wrapper; `blueprint.blocks` may be used by the service. |

Response:

- `success: true`
- `project: Remote project snapshot`
- `pageStructure: Block[]`
- `storage: { state: string; hasLocalCopy: boolean; hasGithubCopy: boolean }`

Behavior:

- persists the edited page structure back to the remote service
- keeps the remote snapshot normalized for later reads
- should preserve unrelated metadata on the project snapshot
### `PATCH /api/projects/:slug`

Updates the stored blueprint.

Parameters:

| Name | In | Type | Required | Notes |
| --- | --- | --- | --- | --- |
| `slug` | path | string | yes | Project slug. |

Body:

| Name | Type | Required | Notes |
| --- | --- | --- | --- |
| `blueprint` | object | yes | Merged into the stored blueprint. |

`blueprint` accepts:

- `blocks?: Block[]`
- any other blueprint keys you want to preserve or update

Response:

- `success: true`

Request example:

```json
{
  "blueprint": {
    "blocks": [
      {
        "instanceId": "block-1-hero",
        "id": "hero-industrial",
        "variant": "industrial",
        "splashId": "grid",
        "bgImage": null,
        "className": null
      }
    ]
  }
}
```

Behavior:

- merges the provided blueprint into the stored project
- reassembles the local homepage when a local project exists

### `POST /api/projects/:slug/push`

Pushes the local project to GitHub.

Parameters:

| Name | In | Type | Required | Notes |
| --- | --- | --- | --- | --- |
| `slug` | path | string | yes | Project slug. |

Body:

- none

Response:

- `success: true`

Requirements:

- the project must exist
- `project.localPath` must exist

Behavior:

- pushes local changes only
- does not deploy

### `POST /api/projects/:slug/pull`

Pulls a GitHub-backed project into the local workspace when the repo is not already cloned.

Parameters:

| Name | In | Type | Required | Notes |
| --- | --- | --- | --- | --- |
| `slug` | path | string | yes | Project slug. |

Body:

| Name | Type | Required | Notes |
| --- | --- | --- | --- |
| `branch` | string | no | Branch to clone. Defaults to the repo default branch or `main`. |

Response:

- `success: true`
- `alreadyLocal: boolean`
- `localPath: string`
- `branch: string`
- `project: Project`

Behavior:

- checks whether the local checkout already exists
- clones the GitHub repo into `/projects/:slug` when needed
- updates storage metadata to `local-and-github`
- does not deploy

### `POST /api/remote/projects/:slug/push`

Synchronizes the repository contents directly to GitHub from the stored project metadata.

Parameters:

| Name | In | Type | Required | Notes |
| --- | --- | --- | --- | --- |
| `slug` | path | string | yes | Project slug. |

Body:

- none

Response:

- `success: true`
- `project: Project`

Behavior:

- writes the current manifest back to GitHub
- regenerates the homepage files from the stored blueprint
- does not depend on a local checkout

### `POST /api/remote/projects/:slug/pull`

Refreshes the project snapshot from GitHub-backed metadata without cloning locally.

Parameters:

| Name | In | Type | Required | Notes |
| --- | --- | --- | --- | --- |
| `slug` | path | string | yes | Project slug. |

Body:

- none

Response:

- `success: true`
- `alreadyLocal: false`
- `project: Project`

Behavior:

- invalidates the in-memory registry cache
- reloads the project snapshot from GitHub-backed storage
- does not create a local checkout

### `POST /api/remote/projects/:slug/deploy`

Triggers a Vercel deployment from the GitHub-backed repository state.

Parameters:

| Name | In | Type | Required | Notes |
| --- | --- | --- | --- | --- |
| `slug` | path | string | yes | Project slug. |

Body:

- none

Response:

- `success: true`
- `deploymentUrl: string`
- `projectUrl: string`
- `projectStatus: string`

Behavior:

- ensures the Vercel project exists
- triggers a GitHub-backed deployment
- updates deployment metadata in the registry snapshot

### `POST /api/remote/projects/:slug/blocks/add`

Adds a homepage block and commits the updated repository files directly.

Body:

- `block` or `blocks[0]`
- optional `index` or `position`

Behavior:

- inserts the normalized block into the stored blueprint
- regenerates `src/app/page.tsx` and the used block component files
- writes the updated manifest to GitHub

### `POST /api/remote/projects/:slug/blocks/replace`

Replaces a block by `instanceId` and writes the updated repository files directly.

Behavior:

- finds the target `instanceId`
- replaces the block payload in the stored blueprint
- regenerates `src/app/page.tsx` and the used block component files
- writes the updated manifest to GitHub

### `PATCH /api/remote/projects/:slug/blocks/:instanceId`

Updates a block in place and writes the updated repository files directly.

Body:

- `block` or `updates`

Behavior:

- keeps `instanceId` stable
- merges block changes into the stored blueprint
- regenerates the remote homepage files

### `DELETE /api/remote/projects/:slug/blocks/:instanceId`

Deletes a block from the stored blueprint and writes the updated repository files directly.

Behavior:

- removes the block from the blueprint
- regenerates the remote homepage files
- writes the updated manifest to GitHub

### `POST /api/projects/:slug/deploy`

Triggers a Vercel deployment for the project.

Parameters:

| Name | In | Type | Required | Notes |
| --- | --- | --- | --- | --- |
| `slug` | path | string | yes | Project slug. |

Body:

- none

Response:

- `success: true`
- `deploymentUrl: string`
- `projectUrl: string`
- `projectStatus: string`

Behavior:

- ensures the Vercel project exists
- triggers a GitHub-backed Vercel deployment using the repo source metadata
- updates the project registry with deployment state

### `POST /api/projects/:slug/run`

Starts the local project runtime.

Parameters:

| Name | In | Type | Required | Notes |
| --- | --- | --- | --- | --- |
| `slug` | path | string | yes | Project slug. |

Body:

- none

Response:

- `success: true`
- `url: string`

Response example:

```json
{
  "success": true,
  "url": "http://localhost:3001"
}
```

### `GET /api/projects/:slug/run`

Returns runtime status.

Parameters:

| Name | In | Type | Required | Notes |
| --- | --- | --- | --- | --- |
| `slug` | path | string | yes | Project slug. |

Body:

- none

Response:

- `isRunning: boolean`
- `url: string \| null`
- `port: number \| null`

### `DELETE /api/projects/:slug/run`

Stops the local runtime.

Parameters:

| Name | In | Type | Required | Notes |
| --- | --- | --- | --- | --- |
| `slug` | path | string | yes | Project slug. |

Body:

- none

Response:

- `success: true`

### `POST /api/projects/:slug/blocks/add`

Adds a block to the stored homepage blueprint.

Parameters:

| Name | In | Type | Required | Notes |
| --- | --- | --- | --- | --- |
| `slug` | path | string | yes | Project slug. |

Body:

| Name | Type | Required | Notes |
| --- | --- | --- | --- |
| `block` | `Block` object | yes | Preferred input shape. |
| `blocks` | array of `Block` | no | If provided, the first item is used. |
| `index` | number | no | Zero-based insert position. |
| `position` | number | no | Alias for `index`. |

Accepted block fields:

- all `Block` fields listed in the schema reference
- any block-specific custom fields used by templates

Response:

- `success: true`
- `block: Block`
- `project: Project`

### `PATCH /api/projects/:slug/blocks/:instanceId`

Updates a specific block identified by `instanceId`.

Parameters:

| Name | In | Type | Required | Notes |
| --- | --- | --- | --- | --- |
| `slug` | path | string | yes | Project slug. |
| `instanceId` | path | string | yes | Stable block identifier to update. |

Body:

| Name | Type | Required | Notes |
| --- | --- | --- | --- |
| `block` | object | yes | Preferred update payload. |
| `updates` | object | no | Alias for `block`. |

Accepted update fields:

- any `Block` field
- any additional block-specific fields
- `instanceId` must match the path if supplied

Response:

- `success: true`
- `block: Block`
- `project: Project`

### `DELETE /api/projects/:slug/blocks/:instanceId`

Removes a specific block identified by `instanceId`.

Parameters:

| Name | In | Type | Required | Notes |
| --- | --- | --- | --- | --- |
| `slug` | path | string | yes | Project slug. |
| `instanceId` | path | string | yes | Stable block identifier to remove. |

Body:

- none

Response:

- `success: true`
- `project: Project`

### `POST /api/projects/:slug/blocks/replace`

Replaces one block with another while preserving the surrounding blueprint structure.

Parameters:

| Name | In | Type | Required | Notes |
| --- | --- | --- | --- | --- |
| `slug` | path | string | yes | Project slug. |

Body:

| Name | Type | Required | Notes |
| --- | --- | --- | --- |
| `instanceId` | string | no | Preferred target block id. |
| `targetInstanceId` | string | no | Alias for `instanceId`. |
| `replaceInstanceId` | string | no | Alias for `instanceId`. |
| `block` | object | yes | Preferred replacement block. |
| `replacement` | object | no | Alias for `block`. |
| `nextBlock` | object | no | Alias for `block`. |

Accepted replacement fields:

- all `Block` fields listed in the schema reference
- any block-specific custom fields used by templates

Response:

- `success: true`
- `block: Block`
- `project: Project`

## JSON Responses

All endpoints in this deployed API surface return JSON except the preview image route.

- Successful mutation endpoints return a `success` flag plus endpoint-specific data.
- Read endpoints return the requested project, project list, or runtime state.
- Error responses return `{ success: false, error: string }` unless noted otherwise.

## Full Page Schema Example

This is an example of a stored homepage blueprint the external service can read and write.

```json
{
  "brandName": "Northstar Systems",
  "name": "Northstar Systems",
  "description": "Industrial automation for modern production teams.",
  "theme": "industrial",
  "toneOfVoice": "confident, technical, concise",
  "assetVibe": "high-contrast industrial imagery with grid overlays",
  "seo": {
    "title": "Northstar Systems",
    "description": "Industrial automation for modern production teams.",
    "keywords": "automation, industrial software, operations"
  },
  "navigation": {
    "links": [
      { "label": "Home", "href": "/" },
      { "label": "Services", "href": "/services" },
      { "label": "About", "href": "/about" },
      { "label": "Contact", "href": "/contact" }
    ],
    "primaryCta": {
      "label": "Book a demo",
      "href": "/contact"
    },
    "socialLinks": [
      { "icon": "mdi:linkedin", "href": "https://linkedin.com/company/northstar" }
    ]
  },
  "head": {
    "favicon": "/favicon.ico",
    "logo": "/logo.svg",
    "ogTitle": "Northstar Systems",
    "ogDescription": "Industrial automation for modern production teams.",
    "ogImage": "/og-image.png",
    "twitterCard": "summary_large_image",
    "twitterImage": "/twitter-card.png",
    "themeColor": "#0f172a"
  },
  "fonts": {
    "heading": "Space_Grotesk",
    "body": "Inter",
    "accent": "IBM_Plex_Mono",
    "mono": "IBM_Plex_Mono"
  },
  "colors": {
    "background": "#0b1020",
    "foreground": "#e5eefc",
    "card": "#111836",
    "cardForeground": "#e5eefc",
    "popover": "#111836",
    "popoverForeground": "#e5eefc",
    "primary": "#7dd3fc",
    "primaryForeground": "#0b1020",
    "secondary": "#1e293b",
    "secondaryForeground": "#e5eefc",
    "tertiary": "#334155",
    "tertiaryForeground": "#e5eefc",
    "quaternary": "#475569",
    "quaternaryForeground": "#e5eefc",
    "muted": "#0f172a",
    "mutedForeground": "#94a3b8",
    "accent": "#22d3ee",
    "accentForeground": "#0b1020",
    "destructive": "#ef4444",
    "destructiveForeground": "#ffffff",
    "border": "#1e293b",
    "input": "#1e293b",
    "ring": "#38bdf8"
  },
  "branding": {
    "logoIcon": "mdi:hexagon-multiple",
    "variant": "modern"
  },
  "header": {
    "variant": "industrial",
    "logo": "Northstar Systems",
    "links": [
      { "label": "Home", "href": "/" },
      { "label": "Services", "href": "/services" }
    ],
    "cta": {
      "label": "Book a demo",
      "href": "/contact"
    }
  },
  "footer": {
    "variant": "industrial",
    "logo": "Northstar Systems",
    "tagline": "Industrial automation for modern production teams.",
    "links": [
      {
        "title": "Navigation",
        "items": [
          { "label": "Home", "href": "/" },
          { "label": "Services", "href": "/services" },
          { "label": "Contact", "href": "/contact" }
        ]
      }
    ],
    "socialLinks": [
      { "icon": "mdi:linkedin", "href": "https://linkedin.com/company/northstar" }
    ],
    "policyLinks": [
      { "label": "Privacy", "href": "/privacy" },
      { "label": "Terms", "href": "/terms" }
    ]
  },
  "sitemap": [
    {
      "path": "/",
      "title": "Home",
      "description": "Homepage",
      "blocks": [
        { "type": "hero", "objective": "Introduce the value proposition" },
        { "type": "features", "objective": "Explain core capabilities" },
        { "type": "testimonials", "objective": "Build trust" },
        { "type": "contact", "objective": "Capture leads" }
      ]
    }
  ],
  "blocks": [
    {
      "instanceId": "block-1-hero",
      "id": "hero-industrial",
      "variant": "industrial",
      "splashId": "grid",
      "bgImage": null,
      "className": null,
      "headline": "Automation that keeps production moving",
      "subheadline": "Predictable workflows for modern operations teams."
    },
    {
      "instanceId": "block-2-features",
      "id": "features-grid",
      "variant": "grid",
      "splashId": "none",
      "bgImage": null,
      "className": null,
      "title": "Capabilities",
      "items": [
        { "title": "Realtime monitoring", "description": "See what is happening now." },
        { "title": "Workflow control", "description": "Keep processes predictable." }
      ]
    },
    {
      "instanceId": "block-3-testimonials",
      "id": "testimonials-industrial",
      "variant": "industrial",
      "splashId": "none",
      "bgImage": null,
      "className": null,
      "title": "Trusted by operators"
    },
    {
      "instanceId": "block-4-contact",
      "id": "contact-industrial",
      "variant": "industrial",
      "splashId": "none",
      "bgImage": null,
      "className": null,
      "title": "Talk to us",
      "subtitle": "Tell us what you are building."
    }
  ]
}
```

## Notes For The External Service

- `id` selects the template/component.
- `instanceId` identifies the placed block instance.
- For a full-page rewrite, send the whole `blocks` array back in `blueprint`.
- For partial edits, update only the relevant block objects before PATCHing.


