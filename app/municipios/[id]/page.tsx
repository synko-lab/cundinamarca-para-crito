import Link from "next/link";
import { adminDb } from "@/lib/firebase-admin";
import MunicipioRouteMapSection from "../../components/MunicipioRouteMapSection";

function fmtNumber(n: number | null, suffix = "") {
  if (n === null || n === undefined) return "Dato pendiente";
  return `${n.toLocaleString("es-CO")}${suffix}`;
}

function fmtMinutos(n: number | null) {
  if (n === null || n === undefined) return "Dato pendiente";
  const horas = Math.floor(n / 60);
  const minutos = Math.round(n % 60);
  if (horas === 0) return `${minutos} min`;
  if (minutos === 0) return `${horas} h`;
  return `${horas} h ${minutos} min`;
}

function initials(nombre: string) {
  return (
    nombre
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join("") || "?"
  );
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const doc = await adminDb.collection("municipios").doc(id).get();

  if (!doc.exists) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white px-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="font-medium text-slate-700">Municipio no encontrado.</p>
          <Link href="/" className="mt-3 inline-block text-sm font-medium text-[#003893] hover:underline">
            ← Volver al mapa
          </Link>
        </div>
      </div>
    );
  }

  const data: any = doc.data();
  const nombre: string = data.nombre ?? "(sin nombre)";

  const iglesiasSnap = await adminDb.collection("iglesias").where("municipio", "==", nombre).get();
  const iglesias = iglesiasSnap.docs
    .map((d) => {
      const it: any = d.data();
      return {
        id: d.id,
        nombre: it.nombre ?? "(sin nombre)",
        pastor: it.pastor ?? null,
        logoUrl: it.logoUrl ?? null,
        createdAt: it.createdAt && it.createdAt.toMillis ? it.createdAt.toMillis() : it.createdAt ?? 0,
      };
    })
    .sort((a, b) => b.createdAt - a.createdAt);

  const rows: [string, string][] = [
    ["Habitantes", fmtNumber(data.habitantes ?? null)],
    ["Extensión", fmtNumber(data.extensionKm2 ?? null, " km²")],
    ["Distancia a IBBF", fmtNumber(data.distanciaBosaCentroKm ?? null, " km")],
    ["Distancia a IBBF (tiempo)", fmtMinutos(data.distanciaBosaCentroMinutos ?? null)],
    ["Coordenadas", data.lat != null && data.lng != null ? `${data.lat}, ${data.lng}` : "Dato pendiente"],
  ];

  return (
    <div
      className="min-h-screen bg-white px-4 py-10 sm:py-16"
      style={{ backgroundImage: "radial-gradient(#e2e8f0 1px, transparent 1px)", backgroundSize: "22px 22px" }}
    >
      <div className="mx-auto w-full max-w-3xl">
        <Link href="/" className="text-sm font-medium text-[#003893] hover:underline">
          ← Volver al mapa
        </Link>

        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="h-2 w-full overflow-hidden">
            <div className="flex h-full">
              <div className="w-1/2 bg-[#FCD116]" />
              <div className="w-1/4 bg-[#003893]" />
              <div className="w-1/4 bg-[#CE1126]" />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-5 p-6 sm:p-8">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 text-xl font-bold text-[#003893] sm:h-24 sm:w-24">
              {data.banderaUrl ? (
                <img src={data.banderaUrl} alt={`Bandera de ${nombre}`} className="h-full w-full object-cover" />
              ) : (
                initials(nombre)
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{nombre}</h1>
              <p className="mt-1 text-sm text-slate-500">Cundinamarca, Colombia</p>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <dl className="divide-y divide-slate-100 rounded-lg border border-slate-200">
            {rows.map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-4 px-4 py-2.5 text-sm">
                <dt className="text-slate-500">{label}</dt>
                <dd className="text-right font-medium text-slate-900">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        {data.lat != null && data.lng != null && (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Ruta a IBBF</h2>
            <MunicipioRouteMapSection nombre={nombre} lat={Number(data.lat)} lng={Number(data.lng)} />
          </div>
        )}

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900">
              Iglesias en {nombre} <span className="text-slate-400">({iglesias.length})</span>
            </h2>
          </div>

          {iglesias.length === 0 ? (
            <div className="mt-5 rounded-lg border border-dashed border-slate-300 px-6 py-10 text-center text-sm text-slate-400">
              Aún no hay iglesias registradas en este municipio.
            </div>
          ) : (
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {iglesias.map((ig) => (
                <Link
                  key={ig.id}
                  href={`/iglesias/${ig.id}`}
                  className="group flex items-center gap-3 rounded-xl border border-slate-200 p-3.5 transition hover:-translate-y-0.5 hover:border-[#003893]/30 hover:shadow-sm"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-emerald-50 text-sm font-bold text-emerald-700">
                    {ig.logoUrl ? <img src={ig.logoUrl} alt="" className="h-full w-full object-cover" /> : initials(ig.nombre)}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate font-medium text-slate-900 group-hover:text-[#003893]">{ig.nombre}</div>
                    {ig.pastor && <div className="truncate text-xs text-slate-400">Pastor: {ig.pastor}</div>}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
