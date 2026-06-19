"use client";

import {
  Children,
  cloneElement,
  isValidElement,
  useEffect,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";

const TOOLTIP_BASE =
  "absolute left-0 top-full z-10 mt-0.5 px-1.5 py-0.5 rounded border border-border-light bg-surface-raised text-[10px] text-text-muted shadow-sm transition-opacity";

interface HintTooltipProps {
  content?: string;
  children: ReactNode;
  className?: string;
  tooltipClassName?: string;
  ariaLabel?: string;
}

export function HintTooltip({
  content,
  children,
  className = "",
  tooltipClassName = "",
  ariaLabel,
}: HintTooltipProps) {
  const [pinned, setPinned] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pinned) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (containerRef.current?.contains(event.target as Node)) return;
      setPinned(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [pinned]);

  if (!content) {
    return <>{children}</>;
  }

  const child = Children.only(children);
  const togglePinned = () => setPinned((visible) => !visible);

  let trigger: ReactNode;
  if (isValidElement(child)) {
    const element = child as ReactElement<{
      onClick?: (event: React.MouseEvent) => void;
      className?: string;
    }>;
    trigger = cloneElement(element, {
      onClick: (event: React.MouseEvent) => {
        element.props.onClick?.(event);
        togglePinned();
      },
      className: [element.props.className, "cursor-help"].filter(Boolean).join(" "),
    });
  } else {
    trigger = (
      <div className="cursor-help" onClick={togglePinned}>
        {child}
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`group relative ${className}`.trim()}>
      {trigger}
      <span
        role="tooltip"
        className={`${TOOLTIP_BASE} ${
          pinned ?
            "opacity-100 visible"
          : "opacity-0 invisible group-hover:opacity-100 group-hover:visible"
        } ${tooltipClassName}`.trim()}
      >
        {content}
      </span>
      {ariaLabel && (
        <span className="sr-only">{ariaLabel}</span>
      )}
    </div>
  );
}
