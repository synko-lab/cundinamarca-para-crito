import Link from "next/link";
import { adminDb } from "@/lib/firebase-admin";
import MapSection from "./components/MapSection";
import MunicipioSelect from "./components/MunicipioSelect";
import type { MunicipioPin } from "./components/CundinamarcaMap";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [municipiosSnap, iglesiasSnap] = await Promise.all([
    adminDb.collection("municipios").get(),
    adminDb.collection("iglesias").count().get(),
  ]);

  const municipios: MunicipioPin[] = municipiosSnap.docs
    .map((d) => {
      const data: any = d.data();
      return {
        id: d.id,
        nombre: data.nombre ?? "(sin nombre)",
        lat: typeof data.lat === "number" ? data.lat : null,
        lng: typeof data.lng === "number" ? data.lng : null,
        habitantes: data.habitantes ?? null,
        banderaUrl: data.banderaUrl ?? null,
      };
    })
    .filter((m): m is MunicipioPin => m.lat !== null && m.lng !== null);

  const municipiosParaSelect = municipiosSnap.docs
    .map((d) => ({ id: d.id, nombre: (d.data().nombre as string) ?? "(sin nombre)" }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

  const totalMunicipios = municipiosSnap.size;
  const totalIglesias = iglesiasSnap.data().count;

  return (
    <div
      className="min-h-screen w-full bg-white"
      style={{ backgroundImage: "radial-gradient(#e2e8f0 1px, transparent 1px)", backgroundSize: "22px 22px" }}
    >
      {/* Mobile: título + stats arriba, mapa ocupa el resto, selector y botón abajo */}
      <div className="flex h-[100dvh] flex-col sm:hidden">
        <div className="shrink-0 space-y-4 p-4">
          <TitleStats totalMunicipios={totalMunicipios} totalIglesias={totalIglesias} enMapa={municipios.length} />
          <MunicipioSelect municipios={municipiosParaSelect} />
        </div>

        <div className="min-h-0 flex-1 px-4">
          {municipios.length === 0 ? (
            <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/70 px-6 text-center">
              <p className="text-sm text-slate-400">Aún no hay municipios con coordenadas registradas.</p>
            </div>
          ) : (
            <MapSection municipios={municipios} className="h-full w-full" />
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

      {/* Desktop: tarjeta flotante sobre el mapa */}
      <div className="hidden min-h-screen w-full items-center justify-center sm:flex">
        <div className="w-11/12 max-w-7xl">
          {municipios.length === 0 ? (
            <>
              <HeroCard totalMunicipios={totalMunicipios} totalIglesias={totalIglesias} enMapa={municipios.length} floating={false} />
              <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white/70 px-6 py-16 text-center">
                <p className="text-sm font-medium text-slate-600">Aún no hay municipios con coordenadas registradas.</p>
                <p className="mt-1 text-sm text-slate-400">Vuelve pronto — estamos completando el mapa de Cundinamarca.</p>
              </div>
            </>
          ) : (
            <div className="relative">
              <MapSection municipios={municipios} />
              <div className="pointer-events-none absolute inset-0 z-[1100] flex items-start p-4 sm:p-6">
                <div className="pointer-events-auto w-full max-w-xs">
                  <HeroCard totalMunicipios={totalMunicipios} totalIglesias={totalIglesias} enMapa={municipios.length} floating />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TitleStats({
  totalMunicipios,
  totalIglesias,
  enMapa,
}: {
  totalMunicipios: number;
  totalIglesias: number;
  enMapa: number;
}) {
  return (
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
          <div className="text-lg font-bold text-[#FCD116] [text-shadow:0_0_0.5px_#b8940e]">{enMapa}</div>
          <div className="text-[11px] text-slate-500">En el mapa</div>
        </div>
      </div>
    </div>
  );
}

function HeroCard({
  totalMunicipios,
  totalIglesias,
  enMapa,
  floating,
}: {
  totalMunicipios: number;
  totalIglesias: number;
  enMapa: number;
  floating: boolean;
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
            {enMapa}
          </div>
          <div className="text-[11px] text-slate-500">En el mapa</div>
        </div>
      </div>
    </div>
  );
}
