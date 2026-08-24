"use client";

import { useState } from "react";
import Link from "next/link";
import MapSection from "./MapSection";
import MunicipioSelect, { type MunicipioOption } from "./MunicipioSelect";
import type { MunicipioPin, IglesiaPin } from "./CundinamarcaMap";

export default function MobileHome({
  totalMunicipios,
  totalIglesias,
  municipios,
  iglesias,
  municipiosOptions,
}: {
  totalMunicipios: number;
  totalIglesias: number;
  municipios: MunicipioPin[];
  iglesias: IglesiaPin[];
  municipiosOptions: MunicipioOption[];
}) {
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const focusedNombre = focusedId ? municipiosOptions.find((m) => m.id === focusedId)?.nombre : null;
  const iglesiasEnFoco = focusedNombre ? iglesias.filter((i) => i.municipio === focusedNombre).length : 0;

  return (
    <div className="flex h-[100dvh] flex-col sm:hidden">
      <div className="shrink-0 space-y-3 p-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 h-2 w-14 overflow-hidden rounded-full">
            <div className="h-1/2 bg-[#FCD116]" />
            <div className="flex h-1/2">
              <div className="w-1/2 bg-[#003893]" />
              <div className="w-1/2 bg-[#CE1126]" />
            </div>
          </div>

          <h1 className="text-xl font-bold tracking-tight text-slate-900">Cundinamarca para Cristo</h1>

          <div className="mt-4 grid grid-cols-3 divide-x divide-slate-200 border-t border-slate-100 pt-3">
            <div className="px-2 text-center">
              <div className="text-lg font-bold text-[#003893]">{totalMunicipios}</div>
              <div className="text-[11px] text-slate-500">Municipios</div>
            </div>
            <div className="px-2 text-center">
              <div className="text-lg font-bold text-[#CE1126]">{totalIglesias}</div>
              <div className="text-[11px] text-slate-500">Iglesias</div>
            </div>
            <div className="px-2 text-center">
              <div className="text-lg font-bold text-[#FCD116] [text-shadow:0_0_0.5px_#b8940e]">{municipios.length}</div>
              <div className="text-[11px] text-slate-500">En el mapa</div>
            </div>
          </div>
        </div>

        <MunicipioSelect municipios={municipiosOptions} value={focusedId} onSelect={setFocusedId} />

        {focusedNombre && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">
              {iglesiasEnFoco > 0 ? (
                <>
                  Mostrando iglesias en <span className="font-semibold text-slate-700">{focusedNombre}</span>
                </>
              ) : (
                <>
                  Sin iglesias en el mapa para <span className="font-semibold text-slate-700">{focusedNombre}</span>
                </>
              )}
            </span>
            <Link href={`/municipios/${focusedId}`} className="font-semibold text-[#003893] hover:underline">
              Ver perfil →
            </Link>
          </div>
        )}

        {focusedNombre && iglesiasEnFoco === 0 && (
          <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-400">
            Aún no hay iglesias con coordenadas registradas en {focusedNombre}. Puede que sí existan iglesias en el
            directorio, solo que sin ubicación cargada todavía.
          </p>
        )}
      </div>

      <div className="min-h-0 flex-1 px-4">
        {municipios.length === 0 ? (
          <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/70 px-6 text-center">
            <p className="text-sm text-slate-400">Aún no hay municipios con coordenadas registradas.</p>
          </div>
        ) : (
          <MapSection municipios={municipios} iglesias={iglesias} focusedMunicipioId={focusedId} className="h-full w-full" />
        )}
      </div>

      <div className="shrink-0 p-4">
        <Link
          href="/iglesias"
          className="block w-full rounded-lg bg-[#003893] px-4 py-3 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-[#002d75]"
        >
          Ver directorio de iglesias
        </Link>
      </div>
    </div>
  );
}
