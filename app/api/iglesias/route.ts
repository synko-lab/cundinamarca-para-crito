
import { NextRequest, NextResponse } from "next/server";
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
        habitantesMunicipio: data.habitantesMunicipio ?? null,
        distanciaBosaCentroKm: data.distanciaBosaCentroKm ?? null,
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

    // Optional numeric fields
    const rawHabitantes = body.habitantesMunicipio;
    const rawDistancia = body.distanciaBosaCentroKm;

    if (!nombre || !pastor || !telefono || !municipio) {
      return NextResponse.json(
        {
          success: false,
          message: "Nombre, pastor, teléfono y municipio son obligatorios.",
        },
        { status: 400 }
      );
    }

    // Validate optional numeric fields if provided (allow null to indicate pending data)
    let habitantesMunicipio: number | null = null;
    if (rawHabitantes !== undefined && rawHabitantes !== null && rawHabitantes !== "") {
      const n = Number(rawHabitantes);
      if (!Number.isFinite(n) || !Number.isInteger(n) || n < 0) {
        return NextResponse.json(
          { success: false, message: "habitantesMunicipio debe ser un entero válido." },
          { status: 400 }
        );
      }
      habitantesMunicipio = Math.round(n);
    }

    let distanciaBosaCentroKm: number | null = null;
    if (rawDistancia !== undefined && rawDistancia !== null && rawDistancia !== "") {
      const d = Number(rawDistancia);
      if (!Number.isFinite(d) || d < 0) {
        return NextResponse.json(
          { success: false, message: "distanciaBosaCentroKm debe ser un número válido." },
          { status: 400 }
        );
      }
      distanciaBosaCentroKm = Number(d);
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
      habitantesMunicipio: habitantesMunicipio,
      distanciaBosaCentroKm: distanciaBosaCentroKm,
      horarios: cleanHorariosForSave(normalizeHorarios(body.horarios)),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

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
