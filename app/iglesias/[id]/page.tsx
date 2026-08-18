import Link from "next/link";
import { adminDb } from "@/lib/firebase-admin";
import { normalizeHorarios } from "@/lib/horarios";
import IglesiaProfile from "./components/IglesiaProfile";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const doc = await adminDb.collection("iglesias").doc(id).get();
  if (!doc.exists) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 px-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="font-medium text-slate-700">Iglesia no encontrada.</p>
          <Link href="/iglesias" className="mt-3 inline-block text-sm font-medium text-emerald-700 hover:underline">
            ← Volver al directorio
          </Link>
        </div>
      </div>
    );
  }

  const data: any = doc.data();
  const initialData = {
    nombre: data.nombre ?? "",
    pastor: data.pastor ?? "",
    telefono: data.telefono ?? "",
    email: data.email ?? "",
    municipio: data.municipio ?? "",
    direccion: data.direccion ?? "",
    barrio: data.barrio ?? "",
    horarios: normalizeHorarios(data.horarios),
    descripcion: data.descripcion ?? "",
    habitantesMunicipio: data.habitantesMunicipio ?? null,
    distanciaBosaCentroKm: data.distanciaBosaCentroKm ?? null,
    createdAt: data.createdAt && data.createdAt.toMillis ? data.createdAt.toMillis() : data.createdAt ?? null,
    updatedAt: data.updatedAt && data.updatedAt.toMillis ? data.updatedAt.toMillis() : data.updatedAt ?? null,
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 px-4 py-10 sm:py-16">
      <div className="mx-auto w-full max-w-3xl">
        <Link href="/iglesias" className="text-sm font-medium text-emerald-700 hover:underline">
          ← Volver al directorio
        </Link>

        <div className="mt-4">
          <IglesiaProfile id={id} initialData={initialData} />
        </div>
      </div>
    </div>
  );
}
