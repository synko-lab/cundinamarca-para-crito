"use client";

import dynamic from "next/dynamic";

const MunicipioRouteMap = dynamic(() => import("./MunicipioRouteMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-slate-50 text-sm text-slate-400">
      Cargando mapa…
    </div>
  ),
});

export default function MunicipioRouteMapSection({
  nombre,
  lat,
  lng,
  minutos,
}: {
  nombre: string;
  lat: number;
  lng: number;
  minutos?: number | null;
}) {
  return (
    <div className="h-[320px] w-full overflow-hidden rounded-2xl border border-slate-200 shadow-sm sm:h-[420px]">
      <MunicipioRouteMap nombre={nombre} lat={lat} lng={lng} minutos={minutos} />
    </div>
  );
}
