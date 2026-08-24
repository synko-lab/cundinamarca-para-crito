"use client";

import { useState } from "react";
import Link from "next/link";
import MapSection from "./MapSection";
import MunicipioSelect, { type MunicipioOption } from "./MunicipioSelect";
import type { MunicipioPin, IglesiaPin } from "./CundinamarcaMap";

export default function DesktopHome({
  totalMunicipios,
  totalIglesias,
  totalHabitantes,
  municipios,
  iglesias,
  municipiosOptions,
}: {
  totalMunicipios: number;
  totalIglesias: number;
  totalHabitantes: string;
  municipios: MunicipioPin[];
  iglesias: IglesiaPin[];
  municipiosOptions: MunicipioOption[];
}) {
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const focusedNombre = focusedId ? municipiosOptions.find((m) => m.id === focusedId)?.nombre : null;
  const iglesiasEnFoco = focusedNombre ? iglesias.filter((i) => i.municipio === focusedNombre).length : 0;

  if (municipios.length === 0) {
    return (
      <>
        <HeroCard
          totalMunicipios={totalMunicipios}
          totalIglesias={totalIglesias}
          totalHabitantes={totalHabitantes}
          floating={false}
          municipiosOptions={municipiosOptions}
          focusedId={focusedId}
          onSelect={setFocusedId}
          focusedNombre={focusedNombre}
          iglesiasEnFoco={iglesiasEnFoco}
        />
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white/70 px-6 py-16 text-center">
          <p className="text-sm font-medium text-slate-600">Aún no hay municipios con coordenadas registradas.</p>
          <p className="mt-1 text-sm text-slate-400">Vuelve pronto — estamos completando el mapa de Cundinamarca.</p>
        </div>
      </>
    );
  }

  return (
    <div className="relative">
      <MapSection municipios={municipios} iglesias={iglesias} focusedMunicipioId={focusedId} />
      <div className="pointer-events-none absolute inset-0 z-[1100] flex items-start p-4 sm:p-6">
        <div className="pointer-events-auto w-full max-w-xs">
          <HeroCard
            totalMunicipios={totalMunicipios}
            totalIglesias={totalIglesias}
            totalHabitantes={totalHabitantes}
            floating
            municipiosOptions={municipiosOptions}
            focusedId={focusedId}
            onSelect={setFocusedId}
            focusedNombre={focusedNombre}
            iglesiasEnFoco={iglesiasEnFoco}
          />
        </div>
      </div>
    </div>
  );
}

function HeroCard({
  totalMunicipios,
  totalIglesias,
  totalHabitantes,
  floating,
  municipiosOptions,
  focusedId,
  onSelect,
  focusedNombre,
  iglesiasEnFoco,
}: {
  totalMunicipios: number;
  totalIglesias: number;
  totalHabitantes: string;
  floating: boolean;
  municipiosOptions: MunicipioOption[];
  focusedId: string | null;
  onSelect: (id: string | null) => void;
  focusedNombre?: string | null;
  iglesiasEnFoco: number;
}) {
  return (
    <div
      className={
        floating
          ? "rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-lg backdrop-blur"
          : "rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-8"
      }
    >
      <div className={floating ? "mb-3 h-2 w-14 overflow-hidden rounded-full" : "mx-auto mb-5 h-2.5 w-20 overflow-hidden rounded-full shadow-sm"}>
        <div className="h-1/2 bg-[#FCD116]" />
        <div className="flex h-1/2">
          <div className="w-1/2 bg-[#003893]" />
          <div className="w-1/2 bg-[#CE1126]" />
        </div>
      </div>

      <h1 className={floating ? "text-xl font-bold tracking-tight text-slate-900" : "text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl"}>
        Cundinamarca para Cristo
      </h1>
      <p className={floating ? "mt-1.5 text-xs text-slate-500" : "mx-auto mt-3 max-w-xl text-sm text-slate-500 sm:text-base"}>
        Explora el mapa, encuentra iglesias por municipio y descubre información general de cada región.
      </p>

      <div className={floating ? "mt-4 space-y-2" : "mx-auto mt-6 max-w-sm space-y-2 text-left"}>
        <MunicipioSelect municipios={municipiosOptions} value={focusedId} onSelect={onSelect} />
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
          <div className="rounded-lg border border-dashed border-[#003893]/30 bg-blue-50/60 px-3 py-2.5 text-left text-xs text-slate-600">
            <p className="font-semibold text-[#003893]">Todavía no hay una iglesia sembrada en {focusedNombre}.</p>
            <p className="mt-1 text-slate-500">
              ¿Y si Dios te está llamando a ser el primero? {focusedNombre} espera una iglesia que le anuncie a Cristo.
            </p>
          </div>
        )}
      </div>

      <div className={floating ? "mt-4" : "mt-6 flex flex-wrap items-center justify-center gap-3"}>
        <Link
          href="/iglesias"
          className={
            floating
              ? "block w-full rounded-lg bg-[#003893] px-4 py-2 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-[#002d75]"
              : "inline-flex items-center gap-2 rounded-lg bg-[#003893] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#002d75]"
          }
        >
          Ver directorio de iglesias
        </Link>
      </div>

      <div
        className={
          floating
            ? "mt-4 grid grid-cols-3 divide-x divide-slate-200 border-t border-slate-100 pt-3"
            : "mx-auto mt-8 flex max-w-md items-stretch divide-x divide-slate-200 rounded-2xl border border-slate-200 bg-white shadow-sm"
        }
      >
        <div className={floating ? "px-2 text-center" : "flex-1 px-4 py-4"}>
          <div className={floating ? "text-lg font-bold text-[#003893]" : "text-2xl font-bold text-[#003893]"}>{totalMunicipios}</div>
          <div className="text-[11px] text-slate-500">Municipios</div>
        </div>
        <div className={floating ? "px-2 text-center" : "flex-1 px-4 py-4"}>
          <div className={floating ? "text-lg font-bold text-[#CE1126]" : "text-2xl font-bold text-[#CE1126]"}>{totalIglesias}</div>
          <div className="text-[11px] text-slate-500">Iglesias</div>
        </div>
        <div className={floating ? "px-2 text-center" : "flex-1 px-4 py-4"}>
          <div
            className={[
              floating ? "text-lg font-bold" : "text-2xl font-bold",
              "text-[#FCD116] [text-shadow:0_0_0.5px_#b8940e]",
            ].join(" ")}
          >
            {totalHabitantes}
          </div>
          <div className="text-[11px] text-slate-500">Habitantes</div>
        </div>
      </div>
    </div>
  );
}
