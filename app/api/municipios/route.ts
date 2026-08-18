import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { requireAdminSession } from "@/lib/admin-session";

export async function GET() {
  try {
    const snapshot = await adminDb.collection("municipios").orderBy("nombre", "asc").limit(500).get();

    const items = snapshot.docs.map((d) => {
      const data: any = d.data();
      return {
        id: d.id,
        nombre: data.nombre ?? null,
        distanciaBosaCentroKm: data.distanciaBosaCentroKm ?? null,
        habitantes: data.habitantes ?? null,
        extensionKm2: data.extensionKm2 ?? null,
        lat: data.lat ?? null,
        lng: data.lng ?? null,
        banderaUrl: data.banderaUrl ?? null,
        createdAt: data.createdAt && data.createdAt.toMillis ? data.createdAt.toMillis() : data.createdAt ?? null,
        updatedAt: data.updatedAt && data.updatedAt.toMillis ? data.updatedAt.toMillis() : data.updatedAt ?? null,
      };
    });

    return NextResponse.json({ success: true, items });
  } catch (error) {
    console.error("Error listing municipios:", error);
    return NextResponse.json({ success: false, message: "No se pudo listar municipios." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const unauthorized = await requireAdminSession(request);
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json();
    const { nombre, banderaUrl, banderaPath } = body;

    if (!nombre || !String(nombre).trim()) {
      return NextResponse.json({ success: false, message: "El nombre del municipio es obligatorio." }, { status: 400 });
    }

    function optionalNonNegativeNumber(raw: unknown, label: string) {
      if (raw === undefined || raw === null || raw === "") return { value: null as number | null };
      const n = Number(raw);
      if (!Number.isFinite(n) || n < 0) {
        return { error: `${label} debe ser un número válido.` };
      }
      return { value: n };
    }

    const distancia = optionalNonNegativeNumber(body.distanciaBosaCentroKm, "distanciaBosaCentroKm");
    if (distancia.error) return NextResponse.json({ success: false, message: distancia.error }, { status: 400 });

    const habitantes = optionalNonNegativeNumber(body.habitantes, "habitantes");
    if (habitantes.error) return NextResponse.json({ success: false, message: habitantes.error }, { status: 400 });

    const extension = optionalNonNegativeNumber(body.extensionKm2, "extensionKm2");
    if (extension.error) return NextResponse.json({ success: false, message: extension.error }, { status: 400 });

    let lat: number | null = null;
    let lng: number | null = null;
    if (body.lat !== undefined && body.lat !== null && body.lat !== "") {
      const n = Number(body.lat);
      if (!Number.isFinite(n) || n < -90 || n > 90) {
        return NextResponse.json({ success: false, message: "Latitud inválida." }, { status: 400 });
      }
      lat = n;
    }
    if (body.lng !== undefined && body.lng !== null && body.lng !== "") {
      const n = Number(body.lng);
      if (!Number.isFinite(n) || n < -180 || n > 180) {
        return NextResponse.json({ success: false, message: "Longitud inválida." }, { status: 400 });
      }
      lng = n;
    }

    const docRef = await adminDb.collection("municipios").add({
      nombre: String(nombre).trim(),
      distanciaBosaCentroKm: distancia.value,
      habitantes: habitantes.value,
      extensionKm2: extension.value,
      lat,
      lng,
      banderaUrl: banderaUrl ? String(banderaUrl) : null,
      banderaPath: banderaPath ? String(banderaPath) : null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true, id: docRef.id }, { status: 201 });
  } catch (error) {
    console.error("Error creando municipio:", error);
    return NextResponse.json({ success: false, message: "No se pudo registrar el municipio." }, { status: 500 });
  }
}
