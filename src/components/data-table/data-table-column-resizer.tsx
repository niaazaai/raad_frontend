import { useCallback, useRef } from 'react';
import { useTranslation } from './i18n';

/**
 * The drag handle on a column's trailing edge.
 *
 * Two things here are easy to get wrong and both are tested:
 *
 * **RTL.** Under `dir="rtl"` a column's trailing edge is on its LEFT, so a drag towards the
 * left must make the column WIDER. Reading the pointer delta straight through gives the
 * opposite, and the failure is quiet: it looks like a stiff, backwards-feeling drag rather
 * than an obvious bug, so nobody files it. The direction is read from the element's own
 * computed style rather than a locale hook, so a nested `dir` still behaves.
 *
 * **Keyboard.** A resize handle that only responds to a pointer is inaccessible, and `axe`
 * says so. This is a focusable `role="separator"` with arrow-key steps, so the whole column
 * layout is reachable without a mouse (06-ui-ux §6).
 */

const STEP = 16;
const LARGE_STEP = 64;

export function DataTableColumnResizer({
  columnLabel, width, min, max, onResize, onCommit,
}: {
  columnLabel: string;
  width: number;
  min: number;
  max?: number;
  /** Fires continuously during a drag, so the column tracks the pointer. */
  onResize: (width: number) => void;
  /** Fires once at the end, so the preference is written once rather than per pixel. */
  onCommit: (width: number) => void;
}) {
  const { t } = useTranslation();
  const handle = useRef<HTMLDivElement | null>(null);
  const latest = useRef(width);

  const clamp = useCallback(
    (value: number): number => Math.min(Math.max(value, min), max ?? Number.POSITIVE_INFINITY),
    [min, max],
  );

  /** +1 in LTR, -1 in RTL: the multiplier that turns a pointer delta into a width delta. */
  const directionFactor = useCallback((): number => {
    const element = handle.current;
    if (element === null || typeof window === 'undefined') return 1;

    return window.getComputedStyle(element).direction === 'rtl' ? -1 : 1;
  }, []);

  const onPointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>): void => {
    event.preventDefault();
    event.stopPropagation();

    const startX = event.clientX;
    const startWidth = width;
    const factor = directionFactor();
    const element = event.currentTarget;

    element.setPointerCapture(event.pointerId);

    const onMove = (move: PointerEvent): void => {
      const next = clamp(startWidth + (move.clientX - startX) * factor);
      latest.current = next;
      onResize(next);
    };

    const onUp = (): void => {
      element.releasePointerCapture(event.pointerId);
      element.removeEventListener('pointermove', onMove);
      element.removeEventListener('pointerup', onUp);
      onCommit(latest.current);
    };

    element.addEventListener('pointermove', onMove);
    element.addEventListener('pointerup', onUp);
  }, [width, clamp, directionFactor, onResize, onCommit]);

  const onKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>): void => {
    // Arrow keys are mirrored too: in RTL, ArrowLeft widens, because left is where the
    // column's trailing edge travels when it grows.
    const factor = directionFactor();
    const step = event.shiftKey ? LARGE_STEP : STEP;

    const delta = event.key === 'ArrowRight' ? step * factor
      : event.key === 'ArrowLeft' ? -step * factor
        : event.key === 'Home' ? min - width
          : undefined;

    if (delta === undefined) return;

    event.preventDefault();
    event.stopPropagation();

    const next = clamp(width + delta);
    onResize(next);
    onCommit(next);
  }, [width, min, clamp, directionFactor, onResize, onCommit]);

  return (
    <div
      ref={handle}
      role="separator"
      aria-orientation="vertical"
      aria-label={t('table.resizeColumn', { column: columnLabel })}
      aria-valuenow={Math.round(width)}
      aria-valuemin={min}
      aria-valuemax={max}
      tabIndex={0}
      onPointerDown={onPointerDown}
      onKeyDown={onKeyDown}
      onClick={(event) => event.stopPropagation()}
      /*
        `end-0` not `right-0`, and a 8px hit area over a 1px visual line — a resize target
        thinner than a finger or a shaky hand is a target people miss (§3.7, AD-043).
      */
      className="absolute inset-y-0 end-0 z-20 w-2 cursor-col-resize touch-none select-none
                 before:absolute before:inset-y-2 before:end-[3px] before:w-px before:bg-border
                 hover:before:bg-primary focus-visible:before:bg-primary focus-visible:outline-none
                 focus-visible:before:w-[2px]"
    />
  );
}
