"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Minus, Plus, Scan, X } from "lucide-react";

/**
 * Native <dialog> lightbox: showModal() gives a focus trap and Esc to close;
 * a click on the backdrop (the dialog element itself) also closes.
 */
export function VisualLightbox({
  open,
  onClose,
  eyebrow,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  eyebrow: string;
  title?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="lens-dialog"
      aria-label={title ?? eyebrow}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      {open && (
        <div className="lens-dialog-inner">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <div className="eyebrow">{eyebrow}</div>
              {title && <h3 className="mb-0 mt-1 text-[22px] font-bold tracking-[-0.5px]">{title}</h3>}
            </div>
            <button className="action-button !p-2" onClick={onClose} aria-label="Close" autoFocus>
              <X size={18} />
            </button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  );
}

const MIN = 0.5;
const MAX = 4;

/** Wheel / button zoom and drag-to-pan for an enlarged diagram. No library needed. */
export function ZoomPan({ children }: { children: ReactNode }) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const box = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(null);

  const zoomBy = (f: number) => setZoom((z) => Math.min(MAX, Math.max(MIN, z * f)));
  const fit = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Non-passive wheel listener so the page doesn't scroll while zooming.
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setZoom((z) => Math.min(MAX, Math.max(MIN, z * (e.deltaY < 0 ? 1.12 : 1 / 1.12))));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  return (
    <div>
      <div
        ref={box}
        className="relative h-[min(68dvh,720px)] cursor-grab touch-none overflow-hidden rounded-[6px] border border-line bg-cream active:cursor-grabbing"
        onPointerDown={(e) => {
          (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
          drag.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
        }}
        onPointerMove={(e) => {
          const d = drag.current;
          if (d) setPan({ x: d.px + e.clientX - d.x, y: d.py + e.clientY - d.y });
        }}
        onPointerUp={() => (drag.current = null)}
        onPointerCancel={() => (drag.current = null)}
        onDoubleClick={fit}
      >
        <div
          className="flex h-full w-full items-center justify-center p-6"
          style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: "center" }}
        >
          {children}
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <button className="action-button !p-2" onClick={() => zoomBy(1 / 1.25)} aria-label="Zoom out">
          <Minus size={16} />
        </button>
        <span className="w-14 text-center font-mono text-[11px] text-muted" aria-live="polite">
          {Math.round(zoom * 100)}%
        </span>
        <button className="action-button !p-2" onClick={() => zoomBy(1.25)} aria-label="Zoom in">
          <Plus size={16} />
        </button>
        <button className="action-button !py-2" onClick={fit} aria-label="Fit to screen">
          <Scan size={15} /> Fit
        </button>
        <span className="ml-auto hidden font-mono text-[10px] uppercase tracking-[0.5px] text-muted sm:block">
          Scroll to zoom · drag to pan · double-click to reset
        </span>
      </div>
    </div>
  );
}
