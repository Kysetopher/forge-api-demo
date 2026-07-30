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

type AccordionType = "single" | "multiple";

type AccordionValue = string | string[] | undefined;

type AccordionContextValue = {
  type: AccordionType;
  value: AccordionValue;
  setValue: (nextValue: AccordionValue) => void;
  collapsible: boolean;
};

type AccordionItemContextValue = {
  open: boolean;
  toggle: () => void;
  contentId: string;
};

const AccordionContext = createContext<AccordionContextValue | null>(null);
const AccordionItemContext = createContext<AccordionItemContextValue | null>(null);

function useAccordionContext() {
  const context = useContext(AccordionContext);

  if (!context) {
    throw new Error("Accordion components must be used within <Accordion>.");
  }

  return context;
}

function useAccordionItemContext() {
  const context = useContext(AccordionItemContext);

  if (!context) {
    throw new Error("AccordionTrigger and AccordionContent must be used within <AccordionItem>.");
  }

  return context;
}

export function useAccordionItemOpen() {
  return useAccordionItemContext().open;
}

function toArray(value: AccordionValue): string[] {
  if (Array.isArray(value)) {
    return value;
  }

  return value ? [value] : [];
}

export type AccordionProps = {
  children: ReactNode;
  type?: AccordionType;
  defaultValue?: AccordionValue;
  value?: AccordionValue;
  onValueChange?: (value: AccordionValue) => void;
  collapsible?: boolean;
  className?: string;
};

export function Accordion({
  children,
  type = "single",
  defaultValue,
  value: valueProp,
  onValueChange,
  collapsible = true,
  className
}: AccordionProps) {
  const [uncontrolledValue, setUncontrolledValue] = useState<AccordionValue>(
    defaultValue ?? (type === "multiple" ? [] : undefined)
  );
  const isControlled = valueProp !== undefined;
  const value = isControlled ? valueProp : uncontrolledValue;

  const contextValue = useMemo<AccordionContextValue>(
    () => ({
      type,
      value,
      collapsible,
      setValue: (nextValue: AccordionValue) => {
        if (!isControlled) {
          setUncontrolledValue(nextValue);
        }

        onValueChange?.(nextValue);
      }
    }),
    [collapsible, isControlled, onValueChange, type, value]
  );

  return (
    <AccordionContext.Provider value={contextValue}>
      <div className={["ui-accordion", className].filter(Boolean).join(" ")}>{children}</div>
    </AccordionContext.Provider>
  );
}

export type AccordionItemProps = {
  value: string;
  children: ReactNode;
  className?: string;
};

export function AccordionItem({ value, children, className }: AccordionItemProps) {
  const { type, value: accordionValue, setValue, collapsible } = useAccordionContext();
  const contentId = useId();
  const open = type === "multiple" ? toArray(accordionValue).includes(value) : accordionValue === value;

  const itemContext = useMemo<AccordionItemContextValue>(
    () => ({
      open,
      contentId,
      toggle: () => {
        if (type === "multiple") {
          const nextValues = toArray(accordionValue);

          if (open) {
            setValue(nextValues.filter((item) => item !== value));
            return;
          }

          setValue([...nextValues, value]);
          return;
        }

        if (open) {
          if (collapsible) {
            setValue(undefined);
          }
          return;
        }

        setValue(value);
      }
    }),
    [accordionValue, collapsible, contentId, open, setValue, type, value]
  );

  return (
    <AccordionItemContext.Provider value={itemContext}>
      <div className={["ui-accordion-item", className].filter(Boolean).join(" ")}>{children}</div>
    </AccordionItemContext.Provider>
  );
}

export type AccordionTriggerProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
};

export function AccordionTrigger({
  children,
  className,
  type = "button",
  onClick,
  disabled,
  ...props
}: AccordionTriggerProps) {
  const { open, toggle, contentId } = useAccordionItemContext();

  return (
    <button
      aria-controls={contentId}
      aria-expanded={open}
      data-state={open ? "open" : "closed"}
      disabled={disabled}
      type={type}
      className={["ui-accordion-trigger", className].filter(Boolean).join(" ")}
      onClick={(event) => {
        onClick?.(event);

        if (!event.defaultPrevented && !disabled) {
          toggle();
        }
      }}
      {...props}
    >
      <span className="ui-accordion-trigger-title">{children}</span>
      <span aria-hidden="true" className="ui-accordion-trigger-icon">
        ▾
      </span>
    </button>
  );
}

export type AccordionContentProps = HTMLAttributes<HTMLDivElement>;

export function AccordionContent({ children, className, style, ...props }: AccordionContentProps) {
  const { open, contentId } = useAccordionItemContext();
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
      aria-hidden={!open}
      data-state={open ? "open" : "closed"}
      className={["ui-accordion-content", className].filter(Boolean).join(" ")}
      style={mergedStyle}
      {...props}
    >
      <div ref={contentRef}>{children}</div>
    </div>
  );
}
