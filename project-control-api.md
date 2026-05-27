# Project Control API

This document explains how an external service should communicate with the Forge Console project-control endpoints.

## Base URL

The hosted Forge Console app lives at:

- `https://website-auto-builder.vercel.app/`

All project-control API requests are relative to that deployment:

- `/api/projects`
- `/api/projects/:slug`
- `/api/projects/:slug/push`
- `/api/projects/:slug/deploy`
- `/api/projects/:slug/run`
- `/api/projects/:slug/blocks/add`
- `/api/projects/:slug/blocks/:instanceId`
- `/api/projects/:slug/blocks/replace`

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

### Existing project edit

1. Call `GET /api/projects/:slug`.
2. Read `project.metadata.blueprint`.
3. Update the relevant block(s).
4. Call `PATCH /api/projects/:slug`.
5. Call `POST /api/projects/:slug/push`.
6. Call `POST /api/projects/:slug/deploy`.
7. Use the dedicated block endpoints when you want a narrower mutation surface.

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
| `metadata` | object | yes | Open-ended project metadata. |

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
| any other key | any | no | Metadata is intentionally open-ended. |

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
- triggers a deployment
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
- For a full-page rewrite, send the whole `blocks` array back in the `blueprint`.
- For partial edits, update only the relevant block objects before PATCHing.
