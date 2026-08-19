"use client";

import React, { useEffect, useCallback } from "react";
import { CloseIcon, ChevronLeftIcon, ChevronRightIcon } from "./icons";
import type { Imagen } from "./IglesiaHero";

export default function Lightbox({
  images,
  index,
  onClose,
  onNavigate,
}: {
  images: Imagen[];
  index: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}) {
  const total = images.length;
  const current = images[index];

  const goPrev = useCallback(() => onNavigate((index - 1 + total) % total), [index, total, onNavigate]);
  const goNext = useCallback(() => onNavigate((index + 1) % total), [index, total, onNavigate]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    }
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose, goPrev, goNext]);

  if (!current) return null;

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/90 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <button
        onClick={onClose}
        className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
        title="Cerrar"
      >
        <CloseIcon className="h-5 w-5" />
      </button>

      {total > 1 && (
        <span className="absolute top-4 left-4 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white">
          {index + 1} / {total}
        </span>
      )}

      {total > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            goPrev();
          }}
          className="absolute left-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 sm:left-4"
          title="Anterior"
        >
          <ChevronLeftIcon className="h-6 w-6" />
        </button>
      )}

      <img
        src={current.url}
        alt={current.nombre}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
      />

      {total > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            goNext();
          }}
          className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 sm:right-4"
          title="Siguiente"
        >
          <ChevronRightIcon className="h-6 w-6" />
        </button>
      )}
    </div>
  );
}
