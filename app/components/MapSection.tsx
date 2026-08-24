"use client";

import dynamic from "next/dynamic";
import type { MunicipioPin, IglesiaPin } from "./CundinamarcaMap";

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
  iglesias,
  focusedMunicipioId,
  onFocusMunicipio,
  className = "h-[520px] w-full sm:h-[680px]",
}: {
  municipios: MunicipioPin[];
  iglesias?: IglesiaPin[];
  focusedMunicipioId?: string | null;
  onFocusMunicipio?: (id: string) => void;
  className?: string;
}) {
  return (
    <div className={`overflow-hidden rounded-2xl border border-slate-200 shadow-sm ${className}`}>
      <CundinamarcaMap
        municipios={municipios}
        iglesias={iglesias}
        focusedMunicipioId={focusedMunicipioId}
        onFocusMunicipio={onFocusMunicipio}
      />
    </div>
  );
}
