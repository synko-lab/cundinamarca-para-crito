import { adminDb } from "@/lib/firebase-admin";
import MobileHome from "./components/MobileHome";
import DesktopHome from "./components/DesktopHome";
import type { MunicipioPin, IglesiaPin } from "./components/CundinamarcaMap";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [municipiosSnap, iglesiasSnap] = await Promise.all([
    adminDb.collection("municipios").get(),
    adminDb.collection("iglesias").get(),
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

  const iglesias: IglesiaPin[] = iglesiasSnap.docs
    .map((d) => {
      const data: any = d.data();
      return {
        id: d.id,
        nombre: data.nombre ?? "(sin nombre)",
        municipio: data.municipio ?? "",
        lat: typeof data.lat === "number" ? data.lat : null,
        lng: typeof data.lng === "number" ? data.lng : null,
        pastor: data.pastor ?? null,
        logoUrl: data.logoUrl ?? null,
      };
    })
    .filter((i): i is IglesiaPin => i.lat !== null && i.lng !== null);

  const totalMunicipios = municipiosSnap.size;
  const totalIglesias = iglesiasSnap.size;

  return (
    <div
      className="min-h-screen w-full bg-white"
      style={{ backgroundImage: "radial-gradient(#e2e8f0 1px, transparent 1px)", backgroundSize: "22px 22px" }}
    >
      {/* Mobile: título + stats arriba, mapa ocupa el resto, selector y botón abajo */}
      <MobileHome
        totalMunicipios={totalMunicipios}
        totalIglesias={totalIglesias}
        totalHabitantes={"+3 M"}
        municipios={municipios}
        iglesias={iglesias}
        municipiosOptions={municipiosParaSelect}
      />

      {/* Desktop: tarjeta flotante sobre el mapa */}
      <div className="hidden min-h-screen w-full items-center justify-center sm:flex">
        <div className="w-11/12 max-w-7xl">
          <DesktopHome
            totalMunicipios={totalMunicipios}
            totalIglesias={totalIglesias}
            totalHabitantes={"+3 M"}
            municipios={municipios}
            iglesias={iglesias}
            municipiosOptions={municipiosParaSelect}
          />
        </div>
      </div>
    </div>
  );
}
