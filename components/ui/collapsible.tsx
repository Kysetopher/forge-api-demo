"use client";

import {
  createContext,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ReactNode
} from "react";

type CollapsibleContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  contentId: string;
  disabled?: boolean;
};

const CollapsibleContext = createContext<CollapsibleContextValue | null>(null);

function useCollapsibleContext() {
  const context = useContext(CollapsibleContext);

  if (!context) {
    throw new Error("Collapsible components must be used within <Collapsible>.");
  }

  return context;
}

export type CollapsibleProps = {
  children: ReactNode;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
  className?: string;
};

export function Collapsible({
  children,
  defaultOpen = false,
  open: openProp,
  onOpenChange,
  disabled,
  className
}: CollapsibleProps) {
  const contentId = useId();
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const isControlled = openProp !== undefined;
  const open = isControlled ? openProp : uncontrolledOpen;

  const value = useMemo<CollapsibleContextValue>(
    () => ({
      open,
      setOpen: (nextOpen: boolean) => {
        if (!isControlled) {
          setUncontrolledOpen(nextOpen);
        }

        onOpenChange?.(nextOpen);
      },
      contentId,
      disabled
    }),
    [contentId, disabled, isControlled, onOpenChange, open]
  );

  return (
    <CollapsibleContext.Provider value={value}>
      <div className={["ui-collapsible", className].filter(Boolean).join(" ")}>{children}</div>
    </CollapsibleContext.Provider>
  );
}

export type CollapsibleTriggerProps = ButtonHTMLAttributes<HTMLButtonElement>;

export function CollapsibleTrigger({
  children,
  className,
  type = "button",
  onClick,
  disabled: triggerDisabled,
  ...props
}: CollapsibleTriggerProps) {
  const { open, setOpen, contentId, disabled } = useCollapsibleContext();

  return (
    <button
      aria-controls={contentId}
      aria-expanded={open}
      data-state={open ? "open" : "closed"}
      disabled={disabled || triggerDisabled}
      type={type}
      className={["ui-collapsible-trigger", className].filter(Boolean).join(" ")}
      onClick={(event) => {
        onClick?.(event);

        if (!event.defaultPrevented && !disabled && !triggerDisabled) {
          setOpen(!open);
        }
      }}
      {...props}
    >
      <span>{children}</span>
      <span aria-hidden="true" className="ui-collapsible-trigger-icon">
        ▾
      </span>
    </button>
  );
}

export type CollapsibleContentProps = HTMLAttributes<HTMLDivElement>;

export function CollapsibleContent({
  children,
  className,
  style,
  ...props
}: CollapsibleContentProps) {
  const { open, contentId } = useCollapsibleContext();
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [height, setHeight] = useState(0);
  const mergedStyle: CSSProperties = {
    ...style,
    maxHeight: open ? `${height}px` : "0px",
    pointerEvents: open ? "auto" : "none",
    opacity: open ? 1 : 0
  };

  useEffect(() => {
    const node = contentRef.current;

    if (!node) {
      return;
    }

    const measure = () => {
      setHeight(node.scrollHeight);
    };

    measure();

    if (typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver(() => {
      measure();
    });

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [children, open]);

  return (
    <div
      id={contentId}
      data-state={open ? "open" : "closed"}
      aria-hidden={!open}
      className={["ui-collapsible-content", className].filter(Boolean).join(" ")}
      style={mergedStyle}
    >
      <div ref={contentRef}>{children}</div>
    </div>
  );
}
