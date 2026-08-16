import Link from "next/link";
import { adminDb } from "@/lib/firebase-admin";

function fmtDate(ms: number | null) {
  if (!ms) return "-";
  return new Date(ms).toLocaleString();
}

export default async function Page() {
  const snapshot = await adminDb.collection("iglesias").orderBy("createdAt", "desc").limit(200).get();
  const items = snapshot.docs.map((d) => {
    const data: any = d.data();
    return {
      id: d.id,
      nombre: data.nombre ?? "(sin nombre)",
      municipio: data.municipio ?? "-",
      createdAt: data.createdAt && data.createdAt.toMillis ? data.createdAt.toMillis() : data.createdAt ?? null,
    };
  });

  return (
    <div style={{ padding: 24, maxWidth: 980, margin: "0 auto" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <h1>Directorio de Iglesias</h1>
        <Link href="/iglesias/registro" style={{ background: "#0b6e4f", color: "#fff", padding: "8px 12px", borderRadius: 8, textDecoration: "none" }}>Registrar Iglesia</Link>
      </header>

      <div style={{ display: "grid", gap: 12 }}>
        {items.map((it) => (
          <article key={it.id} style={{ padding: 14, borderRadius: 10, border: "1px solid #eee", background: "#fff" }}>
            <h3 style={{ margin: 0 }}><Link href={`/iglesias/${it.id}`}>{it.nombre}</Link></h3>
            <p style={{ margin: "6px 0", color: "#6b7280" }}>{it.municipio}</p>
            <small style={{ color: "#9ca3af" }}>Registrada: {fmtDate(it.createdAt)}</small>
          </article>
        ))}
      </div>
    </div>
  );
}
