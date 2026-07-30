"use client";

import { useMemo } from "react";
import type { ProjectControlBlock } from "@/lib/project-control-types";

type PageStructureEditorProps = {
  blocks: ProjectControlBlock[];
  onChange: (blocks: ProjectControlBlock[]) => void;
  className?: string;
};

type EditableField = {
  key: string;
  value: string;
};

const EDITABLE_TEXT_KEYS = new Set([
  "title",
  "subtitle",
  "description",
  "headline",
  "subheadline",
  "heading",
  "body",
  "content",
  "text",
  "label",
  "copy",
  "caption",
  "eyebrow",
  "kicker",
  "buttonText",
  "primaryLabel",
  "secondaryLabel",
  "ctaLabel"
]);

function isLikelyMarkup(value: string) {
  const trimmed = value.trim();

  return (
    trimmed.startsWith("<!DOCTYPE") ||
    trimmed.startsWith("<html") ||
    trimmed.startsWith("<body") ||
    trimmed.startsWith("<div") ||
    trimmed.startsWith("<script") ||
    trimmed.includes("</html>") ||
    trimmed.includes("</body>") ||
    trimmed.includes("</div>")
  );
}

function shouldEditStringField(key: string, value: string) {
  return EDITABLE_TEXT_KEYS.has(key) && !isLikelyMarkup(value);
}

function formatReadonlyValue(value: unknown) {
  if (value === null || value === undefined) {
    return "-";
  }

  if (typeof value === "string") {
    if (isLikelyMarkup(value)) {
      return "Source markup hidden";
    }

    if (value.length > 160) {
      return `${value.slice(0, 157)}...`;
    }

    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return JSON.stringify(value);
}

function collectEditableFields(block: ProjectControlBlock): EditableField[] {
  return Object.entries(block)
    .filter(([key, value]) => typeof value === "string" && shouldEditStringField(key, value))
    .map(([key, value]) => ({
      key,
      value: value as string
    }));
}

export function PageStructureEditor({ blocks, onChange, className }: PageStructureEditorProps) {
  const hasBlocks = blocks.length > 0;

  const summary = useMemo(() => {
    if (!hasBlocks) {
      return "No blocks available.";
    }

    return `${blocks.length} block${blocks.length === 1 ? "" : "s"}`;
  }, [blocks.length, hasBlocks]);

  function updateBlock(index: number, updates: Partial<ProjectControlBlock>) {
    const nextBlocks = blocks.map((block, blockIndex) =>
      blockIndex === index ? { ...block, ...updates } : block
    );

    onChange(nextBlocks);
  }

  function updateStringField(index: number, key: string, value: string) {
    updateBlock(index, { [key]: value } as Partial<ProjectControlBlock>);
  }

  return (
    <section className={['ui-page-structure-editor', className].filter(Boolean).join(' ')}>
      <div className="ui-page-structure-editor-header">
        <div>
          <h3 className="ui-page-structure-editor-title">Page Structure</h3>
          <p className="ui-page-structure-editor-summary">{summary}</p>
        </div>
      </div>

      {!hasBlocks ? (
        <div className="ui-page-structure-editor-empty">No blocks found in the remote page structure.</div>
      ) : (
        <div className="ui-page-structure-editor-grid">
          {blocks.map((block, index) => {
            const editableFields = collectEditableFields(block);
            const readonlyEntries = Object.entries(block).filter(([key, value]) => {
              if (key === "id" || key === "instanceId") {
                return true;
              }

              if (typeof value !== "string") {
                return true;
              }

              return !shouldEditStringField(key, value);
            });

            return (
              <article key={block.instanceId || `${block.id}-${index}`} className="ui-page-structure-card">
                <div className="ui-page-structure-card-header">
                  <div>
                    <p className="ui-page-structure-card-title">{block.id}</p>
                    <p className="ui-page-structure-card-subtitle">
                      {block.instanceId ? `Instance ${block.instanceId}` : 'No instanceId'}
                    </p>
                  </div>
                  <span className="ui-page-structure-card-index">{index + 1}</span>
                </div>

                <div className="ui-page-structure-fields">
                  {readonlyEntries.map(([key, value]) => (
                    <div key={key} className="ui-page-structure-field">
                      <label className="ui-page-structure-label">{key}</label>
                      <div className="ui-page-structure-readonly">{formatReadonlyValue(value)}</div>
                    </div>
                  ))}
                </div>

                {editableFields.length > 0 ? (
                  <div className="ui-page-structure-fields">
                    <div className="ui-page-structure-editable-heading">Editable text fields</div>
                    {editableFields.map(({ key, value }) => {
                      const multiline = value.includes('\n') || value.length > 120;

                      return (
                        <div key={key} className="ui-page-structure-field">
                          <label htmlFor={`${block.instanceId || block.id}-${index}-${key}`} className="ui-page-structure-label">
                            {key}
                          </label>
                          {multiline ? (
                            <textarea
                              id={`${block.instanceId || block.id}-${index}-${key}`}
                              className="ui-page-structure-textarea"
                              value={value}
                              onChange={(event) => updateStringField(index, key, event.target.value)}
                            />
                          ) : (
                            <input
                              id={`${block.instanceId || block.id}-${index}-${key}`}
                              className="ui-page-structure-input"
                              value={value}
                              onChange={(event) => updateStringField(index, key, event.target.value)}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
