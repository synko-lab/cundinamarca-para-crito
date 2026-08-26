import { adminDb } from "@/lib/firebase-admin";
import ResponsiveHome from "./components/ResponsiveHome";
import type { MunicipioPin, IglesiaPin } from "./components/CundinamarcaMap";

// Los municipios de Cundinamarca son un dato geográfico fijo (116, siempre)
// y las iglesias solo cambian cuando el admin registra/edita/borra una: no
// tiene sentido refrescar por tiempo. La página queda cacheada
// indefinidamente y las rutas de mutación en app/api/iglesias y
// app/api/municipios la invalidan on-demand con revalidatePath("/").
export const revalidate = false;

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
      <ResponsiveHome
        totalMunicipios={totalMunicipios}
        totalIglesias={totalIglesias}
        totalHabitantes={"+3 M"}
        municipios={municipios}
        iglesias={iglesias}
        municipiosOptions={municipiosParaSelect}
      />
    </div>
  );
}
