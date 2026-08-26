
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { requireAdminSession } from "@/lib/admin-session";
import { normalizeHorarios, cleanHorariosForSave } from "@/lib/horarios";

export async function GET() {
  try {
    const snapshot = await adminDb.collection("iglesias").orderBy("createdAt", "desc").limit(200).get();

    const items = snapshot.docs.map((d) => {
      const data: any = d.data();
      return {
        id: d.id,
        nombre: data.nombre ?? null,
        pastor: data.pastor ?? null,
        logoUrl: data.logoUrl ?? null,
        telefono: data.telefono ?? null,
        email: data.email ?? null,
        municipio: data.municipio ?? null,
        direccion: data.direccion ?? null,
        barrio: data.barrio ?? null,
        descripcion: data.descripcion ?? null,
        lat: typeof data.lat === "number" ? data.lat : null,
        lng: typeof data.lng === "number" ? data.lng : null,
        createdAt: data.createdAt && data.createdAt.toMillis ? data.createdAt.toMillis() : data.createdAt ?? null,
        updatedAt: data.updatedAt && data.updatedAt.toMillis ? data.updatedAt.toMillis() : data.updatedAt ?? null,
      };
    });

    return NextResponse.json({ success: true, items });
  } catch (error) {
    console.error("Error listing iglesias:", error);
    return NextResponse.json({ success: false, message: "No se pudo listar iglesias." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const unauthorized = await requireAdminSession(request);
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json();
    const {
      nombre,
      pastor,
      telefono,
      email,
      municipio,
      direccion,
      barrio,
      descripcion,
    } = body;

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

    if (!nombre || !pastor || !telefono || !municipio) {
      return NextResponse.json(
        {
          success: false,
          message: "Nombre, pastor, teléfono y municipio son obligatorios.",
        },
        { status: 400 }
      );
    }

    const iglesiaRef = await adminDb.collection("iglesias").add({
      nombre: String(nombre).trim(),
      pastor: String(pastor).trim(),
      telefono: String(telefono).trim(),
      email: email ? String(email).trim() : "",
      municipio: String(municipio).trim(),
      direccion: direccion ? String(direccion).trim() : "",
      barrio: barrio ? String(barrio).trim() : "",
      descripcion: descripcion ? String(descripcion).trim() : "",
      lat,
      lng,
      horarios: cleanHorariosForSave(normalizeHorarios(body.horarios)),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    revalidatePath("/");

    return NextResponse.json(
      {
        success: true,
        message: "Iglesia registrada correctamente.",
        id: iglesiaRef.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error registrando iglesia:", error);

    return NextResponse.json(
      { success: false, message: "No se pudo registrar la iglesia." },
      { status: 500 }
    );
  }
}
