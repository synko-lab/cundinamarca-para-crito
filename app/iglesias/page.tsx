import { adminDb } from "@/lib/firebase-admin";
import IglesiasDirectory, { type IglesiaListItem } from "./components/IglesiasDirectory";

export const dynamic = "force-dynamic";

export default async function Page() {
  const snapshot = await adminDb.collection("iglesias").orderBy("createdAt", "desc").limit(500).get();
  const items: IglesiaListItem[] = snapshot.docs.map((d) => {
    const data: any = d.data();
    return {
      id: d.id,
      nombre: data.nombre ?? "(sin nombre)",
      pastor: data.pastor ?? null,
      municipio: data.municipio ?? "-",
      logoUrl: data.logoUrl ?? null,
      createdAt: data.createdAt && data.createdAt.toMillis ? data.createdAt.toMillis() : data.createdAt ?? null,
    };
  });

  return <IglesiasDirectory items={items} />;
}
