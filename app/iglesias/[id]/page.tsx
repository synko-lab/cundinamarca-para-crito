import Link from "next/link";
import { adminDb } from "@/lib/firebase-admin";
import ImagenesManager from "./components/ImagenesManager";

function fmtDate(ms: number | null) {
  if (!ms) return "-";
  return new Date(ms).toLocaleString();
}

export default async function Page({ params }: { params: { id: string } }) {
  const { id } = params;
  const doc = await adminDb.collection("iglesias").doc(id).get();
  if (!doc.exists) return (
    <div style={{ padding: 24 }}>
      <p>Iglesia no encontrada.</p>
      <Link href="/iglesias">Volver al directorio</Link>
    </div>
  );

  const data: any = doc.data();
  const createdAt = data.createdAt && data.createdAt.toMillis ? data.createdAt.toMillis() : data.createdAt ?? null;
  const updatedAt = data.updatedAt && data.updatedAt.toMillis ? data.updatedAt.toMillis() : data.updatedAt ?? null;

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <Link href="/iglesias">← Volver al directorio</Link>
      <h1 style={{ marginTop: 12 }}>{data.nombre ?? "(sin nombre)"}</h1>
      <p style={{ color: "#6b7280" }}>{data.pastor ? `Pastor: ${data.pastor}` : ""}</p>

      <section style={{ marginTop: 18, display: "grid", gap: 8 }}>
        <div><strong>Teléfono:</strong> {data.telefono ?? "-"}</div>
        <div><strong>Correo:</strong> {data.email ?? "-"}</div>
        <div><strong>Municipio:</strong> {data.municipio ?? "-"}</div>
        <div><strong>Dirección:</strong> {data.direccion ?? "-"}</div>
        <div><strong>Barrio:</strong> {data.barrio ?? "-"}</div>
        <div><strong>Denominación:</strong> {data.denominacion ?? "-"}</div>
        <div><strong>Horario de culto:</strong> {data.horarioCulto ?? "-"}</div>
        <div><strong>Habitantes municipio:</strong> {data.habitantesMunicipio ?? "Dato pendiente"}</div>
        <div><strong>Distancia a Bosa Centro (km):</strong> {data.distanciaBosaCentroKm ?? "Dato pendiente"}</div>
        <div><strong>Descripción:</strong> <div style={{ marginTop:6 }}>{data.descripcion ?? "-"}</div></div>
        <div style={{ color: "#9ca3af" }}><small>Creado: {fmtDate(createdAt)} • Actualizado: {fmtDate(updatedAt)}</small></div>
      </section>
      <ImagenesManager iglesiaId={id} />
    </div>
  );
}
