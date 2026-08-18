"use client";

import React, { useRef, useState } from "react";
import { uploadImageClient } from "@/lib/storageClient";
import { CameraIcon, PencilIcon } from "./icons";

export type Imagen = {
  id: string;
  url: string;
  storagePath: string;
  tipo: string;
  nombre: string;
  createdAt: number | null;
};

function initials(nombre: string) {
  return nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("") || "?";
}

export default function IglesiaHero({
  iglesiaId,
  nombre,
  pastor,
  municipio,
  logo,
  portada,
  onChanged,
  onEdit,
  readOnly = false,
}: {
  iglesiaId: string;
  nombre: string;
  pastor: string;
  municipio: string;
  logo: Imagen | null;
  portada: Imagen | null;
  onChanged?: () => void;
  onEdit?: () => void;
  readOnly?: boolean;
}) {
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingPortada, setUploadingPortada] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const portadaInputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(file: File, tipo: "logo" | "portada") {
    const setUploading = tipo === "logo" ? setUploadingLogo : setUploadingPortada;
    setUploading(true);
    try {
      const result = await uploadImageClient(file, iglesiaId, () => {});
      await fetch(`/api/iglesias/${iglesiaId}/imagenes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageId: result.imageId,
          url: result.downloadURL,
          storagePath: result.storagePath,
          tipo,
          nombre: result.nombre,
        }),
      });
      onChanged?.();
    } catch (err) {
      console.error(`Error subiendo ${tipo}:`, err);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div
        className="relative h-36 w-full bg-gradient-to-br from-emerald-600 to-emerald-800 sm:h-48"
        style={portada ? { backgroundImage: `url(${portada.url})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
      >
        {!readOnly && (
          <>
            <input
              ref={portadaInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleUpload(f, "portada");
                e.target.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => portadaInputRef.current?.click()}
              disabled={uploadingPortada}
              className="absolute right-3 top-3 flex items-center gap-1.5 rounded-lg bg-black/40 px-3 py-1.5 text-xs font-medium text-white backdrop-blur transition hover:bg-black/55 disabled:opacity-60"
            >
              <CameraIcon className="h-3.5 w-3.5" />
              {uploadingPortada ? "Subiendo…" : portada ? "Cambiar portada" : "Agregar portada"}
            </button>
          </>
        )}
      </div>

      <div className="px-5 pb-5 sm:px-8 sm:pb-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex items-end gap-4">
            <div className="group relative -mt-10 h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-4 border-white bg-white shadow-md sm:-mt-12 sm:h-24 sm:w-24">
              {logo ? (
                <img src={logo.url} alt="Logo" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-emerald-50 text-xl font-bold text-emerald-700 sm:text-2xl">
                  {initials(nombre)}
                </div>
              )}
              {!readOnly && (
                <>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleUpload(f, "logo");
                      e.target.value = "";
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={uploadingLogo}
                    className="absolute inset-0 flex items-center justify-center bg-black/0 text-white opacity-0 transition group-hover:bg-black/40 group-hover:opacity-100 disabled:opacity-60"
                    title={logo ? "Cambiar logo" : "Agregar logo"}
                  >
                    <CameraIcon className="h-5 w-5" />
                  </button>
                </>
              )}
            </div>

            <div className="pb-1">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{nombre || "(sin nombre)"}</h1>
              {pastor && <p className="text-sm text-slate-500">Pastor: {pastor}</p>}
            </div>
          </div>

          <div className="flex items-center gap-2 pb-1">
            {municipio && (
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">{municipio}</span>
            )}
            {!readOnly && onEdit && (
              <button
                onClick={onEdit}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3.5 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <PencilIcon className="h-3.5 w-3.5" />
                Editar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
