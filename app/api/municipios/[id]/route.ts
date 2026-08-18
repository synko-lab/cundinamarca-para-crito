import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { requireAdminSession } from "@/lib/admin-session";
import { deleteCloudinaryImage } from "@/lib/cloudinary-admin";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const doc = await adminDb.collection("municipios").doc(id).get();
    if (!doc.exists) return NextResponse.json({ success: false, message: "No encontrado" }, { status: 404 });

    const data: any = doc.data();
    return NextResponse.json({
      success: true,
      item: {
        id: doc.id,
        ...data,
        createdAt: data.createdAt && data.createdAt.toMillis ? data.createdAt.toMillis() : data.createdAt ?? null,
        updatedAt: data.updatedAt && data.updatedAt.toMillis ? data.updatedAt.toMillis() : data.updatedAt ?? null,
      },
    });
  } catch (error) {
    console.error("Error getting municipio:", error);
    return NextResponse.json({ success: false, message: "Error interno" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = await requireAdminSession(request);
  if (unauthorized) return unauthorized;

  try {
    const { id } = await params;
    const docRef = adminDb.collection("municipios").doc(id);
    const existing = await docRef.get();
    if (!existing.exists) return NextResponse.json({ success: false, message: "No encontrado" }, { status: 404 });

    const body = await request.json();
    const { nombre } = body;
    if (!nombre || !String(nombre).trim()) {
      return NextResponse.json({ success: false, message: "El nombre del municipio es obligatorio." }, { status: 400 });
    }

    function optionalNonNegativeNumber(raw: unknown) {
      if (raw === undefined || raw === null || raw === "") return null;
      const n = Number(raw);
      return Number.isFinite(n) && n >= 0 ? n : null;
    }

    const update: Record<string, unknown> = {
      nombre: String(nombre).trim(),
      distanciaBosaCentroKm: optionalNonNegativeNumber(body.distanciaBosaCentroKm),
      habitantes: optionalNonNegativeNumber(body.habitantes),
      extensionKm2: optionalNonNegativeNumber(body.extensionKm2),
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (body.lat !== undefined && body.lat !== null && body.lat !== "") update.lat = Number(body.lat);
    if (body.lng !== undefined && body.lng !== null && body.lng !== "") update.lng = Number(body.lng);
    if (body.banderaUrl) update.banderaUrl = String(body.banderaUrl);
    if (body.banderaPath) update.banderaPath = String(body.banderaPath);

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
    console.error("Error updating municipio:", error);
    return NextResponse.json({ success: false, message: "No se pudo actualizar el municipio." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = await requireAdminSession(request);
  if (unauthorized) return unauthorized;

  try {
    const { id } = await params;
    const docRef = adminDb.collection("municipios").doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return NextResponse.json({ success: false, message: "No encontrado" }, { status: 404 });

    const banderaPath = doc.data()?.banderaPath;
    if (banderaPath) {
      try {
        await deleteCloudinaryImage(String(banderaPath));
      } catch (err) {
        console.error("Error deleting bandera during municipio delete:", err);
      }
    }

    await docRef.delete();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting municipio:", error);
    return NextResponse.json({ success: false, message: "No se pudo eliminar el municipio." }, { status: 500 });
  }
}
