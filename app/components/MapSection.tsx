"use client";

import dynamic from "next/dynamic";
import type { MunicipioPin } from "./CundinamarcaMap";

const CundinamarcaMap = dynamic(() => import("./CundinamarcaMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-slate-50 text-sm text-slate-400">
      Cargando mapa…
    </div>
  ),
});

export default function MapSection({
  municipios,
  className = "h-[520px] w-full sm:h-[680px]",
}: {
  municipios: MunicipioPin[];
  className?: string;
}) {
  return (
    <div className={`overflow-hidden rounded-2xl border border-slate-200 shadow-sm ${className}`}>
      <CundinamarcaMap municipios={municipios} />
    </div>
  );
}
