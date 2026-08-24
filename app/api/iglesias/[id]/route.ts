import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { requireAdminSession } from "@/lib/admin-session";
import { deleteCloudinaryImage } from "@/lib/cloudinary-admin";
import { normalizeHorarios, cleanHorariosForSave } from "@/lib/horarios";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const doc = await adminDb.collection("iglesias").doc(id).get();
    if (!doc.exists) return NextResponse.json({ success: false, message: "No encontrado" }, { status: 404 });

    const data: any = doc.data();
    const result = {
      id: doc.id,
      ...data,
      createdAt: data.createdAt && data.createdAt.toMillis ? data.createdAt.toMillis() : data.createdAt ?? null,
      updatedAt: data.updatedAt && data.updatedAt.toMillis ? data.updatedAt.toMillis() : data.updatedAt ?? null,
    };

    return NextResponse.json({ success: true, item: result });
  } catch (error) {
    console.error("Error getting iglesia:", error);
    return NextResponse.json({ success: false, message: "Error interno" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = await requireAdminSession(request);
  if (unauthorized) return unauthorized;

  try {
    const { id } = await params;
    const docRef = adminDb.collection("iglesias").doc(id);
    const existing = await docRef.get();
    if (!existing.exists) return NextResponse.json({ success: false, message: "No encontrado" }, { status: 404 });

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

    if (!nombre || !pastor || !telefono || !municipio) {
      return NextResponse.json(
        { success: false, message: "Nombre, pastor, teléfono y municipio son obligatorios." },
        { status: 400 }
      );
    }

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

    const update = {
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
      updatedAt: FieldValue.serverTimestamp(),
    };

    await docRef.update(update);
    const updatedDoc = await docRef.get();
    const data: any = updatedDoc.data();

    return NextResponse.json({
      success: true,
      item: {
        id: updatedDoc.id,
        ...data,
        createdAt: data.createdAt && data.createdAt.toMillis ? data.createdAt.toMillis() : data.createdAt ?? null,
        updatedAt: data.updatedAt && data.updatedAt.toMillis ? data.updatedAt.toMillis() : data.updatedAt ?? null,
      },
    });
  } catch (error) {
    console.error("Error updating iglesia:", error);
    return NextResponse.json({ success: false, message: "No se pudo actualizar la iglesia." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = await requireAdminSession(request);
  if (unauthorized) return unauthorized;

  try {
    const { id } = await params;
    const docRef = adminDb.collection("iglesias").doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return NextResponse.json({ success: false, message: "No encontrado" }, { status: 404 });

    const imagenesSnap = await docRef.collection("imagenes").get();
    for (const imgDoc of imagenesSnap.docs) {
      const storagePath = imgDoc.data()?.storagePath;
      if (storagePath) {
        try {
          await deleteCloudinaryImage(String(storagePath));
        } catch (err) {
          console.error("Error deleting Cloudinary image during iglesia delete:", err);
        }
      }
    }

    const batch = adminDb.batch();
    imagenesSnap.docs.forEach((d) => batch.delete(d.ref));
    batch.delete(docRef);
    await batch.commit();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting iglesia:", error);
    return NextResponse.json({ success: false, message: "No se pudo eliminar la iglesia." }, { status: 500 });
  }
}
