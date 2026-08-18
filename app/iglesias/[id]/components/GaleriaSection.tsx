"use client";

import React, { useState } from "react";
import { uploadImageClient } from "@/lib/storageClient";
import { ImageIcon, TrashIcon } from "./icons";
import type { Imagen } from "./IglesiaHero";

export default function GaleriaSection({
  iglesiaId,
  images,
  onChanged,
  readOnly = false,
}: {
  iglesiaId: string;
  images: Imagen[];
  onChanged?: () => void;
  readOnly?: boolean;
}) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    setUploading(true);
    try {
      const result = await uploadImageClient(file, iglesiaId, (p) => setProgress(p));
      const res = await fetch(`/api/iglesias/${iglesiaId}/imagenes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageId: result.imageId,
          url: result.downloadURL,
          storagePath: result.storagePath,
          tipo: "galeria",
          nombre: result.nombre,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Error guardando la imagen");
      onChanged?.();
    } catch (err: any) {
      setError(err?.message || String(err));
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }

  async function handleDelete(imageId: string) {
    if (!confirm("¿Eliminar esta imagen de la galería?")) return;
    try {
      const res = await fetch(`/api/iglesias/${iglesiaId}/imagenes/${imageId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Error eliminando");
      onChanged?.();
    } catch (err: any) {
      setError(err?.message || String(err));
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5 text-emerald-700" />
          <h2 className="text-lg font-semibold text-slate-900">Galería</h2>
        </div>

        {!readOnly && (
          <label className="cursor-pointer rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
                e.target.value = "";
              }}
            />
            {uploading ? `Subiendo ${progress}%` : "+ Agregar foto"}
          </label>
        )}
      </div>

      {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {images.length === 0 ? (
        <div className="mt-5 rounded-lg border border-dashed border-slate-300 px-6 py-10 text-center text-sm text-slate-400">
          Aún no hay fotos en la galería.
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {images.map((img) => (
            <div key={img.id} className="group relative overflow-hidden rounded-lg border border-slate-200">
              <div className="flex h-32 w-full items-center justify-center bg-slate-100">
                <img src={img.url} alt={img.nombre} className="h-full w-full object-cover" />
              </div>
              {!readOnly && (
                <button
                  onClick={() => handleDelete(img.id)}
                  className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition group-hover:opacity-100"
                  title="Eliminar"
                >
                  <TrashIcon className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
