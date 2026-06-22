"use client";

import { createPortal } from "react-dom";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";

interface HintTooltipProps {
  content?: string;
  children: ReactNode;
  className?: string;
  /** Long-form content opens in a dialog instead of a floating hint */
  panel?: boolean;
  ariaLabel?: string;
}

function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

function useCoarsePointer() {
  const [coarse, setCoarse] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse)");
    const update = () => setCoarse(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return coarse;
}

function positionFloatingTooltip(
  trigger: HTMLElement,
  tooltip: HTMLElement
): { top: number; left: number } {
  const margin = 8;
  const rect = trigger.getBoundingClientRect();
  const tipWidth = tooltip.offsetWidth;
  const tipHeight = tooltip.offsetHeight;

  let left = rect.left + rect.width / 2 - tipWidth / 2;
  left = Math.max(margin, Math.min(left, window.innerWidth - tipWidth - margin));

  let top = rect.bottom + 6;
  if (top + tipHeight > window.innerHeight - margin) {
    top = rect.top - tipHeight - 6;
  }
  top = Math.max(margin, top);

  return { top, left };
}

function FloatingHint({
  content,
  children,
  className = "",
  ariaLabel,
}: Required<Pick<HintTooltipProps, "content" | "children">> &
  Pick<HintTooltipProps, "className" | "ariaLabel">) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const mounted = useMounted();
  const coarse = useCoarsePointer();

  const close = useCallback(() => setOpen(false), []);

  const openHint = useCallback(() => {
    setOpen(true);
  }, []);

  useEffect(() => {
    if (!open || !triggerRef.current || !tooltipRef.current) return;
    const { top, left } = positionFloatingTooltip(
      triggerRef.current,
      tooltipRef.current
    );
    tooltipRef.current.style.top = `${top}px`;
    tooltipRef.current.style.left = `${left}px`;
  }, [open, content]);

  useEffect(() => {
    if (!open || !coarse) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (tooltipRef.current?.contains(target)) return;
      close();
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open, coarse, close]);

  const tooltip =
    open && mounted
      ? createPortal(
          <>
            {coarse && (
              <div className="fixed inset-0 z-90" aria-hidden onClick={close} />
            )}
            <div
              ref={tooltipRef}
              role="tooltip"
              className="fixed z-100 max-w-[min(calc(100vw-1rem),16rem)] rounded-md border border-border-light bg-surface-raised px-2.5 py-1.5 text-[11px] leading-snug text-text-secondary shadow-lg"
            >
              {content}
            </div>
          </>,
          document.body
        )
      : null;

  return (
    <>
      <span
        ref={triggerRef}
        className={`cursor-help underline decoration-dotted underline-offset-2 ${className}`.trim()}
        aria-label={ariaLabel}
        onMouseEnter={coarse ? undefined : openHint}
        onMouseLeave={coarse ? undefined : close}
        onFocus={coarse ? undefined : openHint}
        onBlur={coarse ? undefined : close}
        onClick={coarse ? () => setOpen((v) => !v) : undefined}
        tabIndex={0}
      >
        {children}
      </span>
      {tooltip}
    </>
  );
}

function PanelHint({
  content,
  children,
  className = "",
  ariaLabel,
}: Required<Pick<HintTooltipProps, "content" | "children">> &
  Pick<HintTooltipProps, "className" | "ariaLabel">) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const mounted = useMounted();

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, close]);

  const dialog =
    open && mounted
      ? createPortal(
          <div className="fixed inset-0 z-100 flex items-end justify-center sm:items-center p-3 sm:p-4">
            <button
              type="button"
              className="absolute inset-0 bg-black/50"
              onClick={close}
              aria-label="Close"
            />
            <div
              id={id}
              role="dialog"
              aria-modal="true"
              aria-label={ariaLabel ?? "Details"}
              className="relative w-full max-w-md max-h-[min(75dvh,28rem)] overflow-y-auto rounded-t-2xl sm:rounded-2xl border border-border bg-surface px-4 py-4 text-xs leading-relaxed text-text-secondary whitespace-pre-line shadow-xl mb-[env(safe-area-inset-bottom)] sm:mb-0"
            >
              {content}
              <button
                type="button"
                onClick={close}
                className="mt-4 w-full py-2.5 rounded-lg bg-surface-raised text-text text-xs font-medium hover:bg-border-light transition-colors"
              >
                Close
              </button>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <button
        type="button"
        className={`cursor-help text-left hover:text-text transition-colors ${className}`.trim()}
        onClick={() => setOpen(true)}
        aria-label={ariaLabel ?? "Show details"}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
      >
        {children}
      </button>
      {dialog}
    </>
  );
}

export function HintTooltip({
  content,
  children,
  className = "",
  panel = false,
  ariaLabel,
}: HintTooltipProps) {
  if (!content) {
    return <>{children}</>;
  }

  if (panel) {
    return (
      <PanelHint content={content} className={className} ariaLabel={ariaLabel}>
        {children}
      </PanelHint>
    );
  }

  return (
    <FloatingHint content={content} className={className} ariaLabel={ariaLabel}>
      {children}
    </FloatingHint>
  );
}
