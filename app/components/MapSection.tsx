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

export default function MapSection({ municipios }: { municipios: MunicipioPin[] }) {
  return (
    <div className="h-[520px] w-full overflow-hidden rounded-2xl border border-slate-200 shadow-sm sm:h-[680px]">
      <CundinamarcaMap municipios={municipios} />
    </div>
  );
}
