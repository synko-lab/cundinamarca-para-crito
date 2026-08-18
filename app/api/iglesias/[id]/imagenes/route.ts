import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { requireAdminSession } from "@/lib/admin-session";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const snapshot = await adminDb.collection("iglesias").doc(id).collection("imagenes").orderBy("createdAt", "desc").get();

    const items = snapshot.docs.map((d) => {
      const data: any = d.data();
      return {
        id: d.id,
        url: data.url ?? null,
        storagePath: data.storagePath ?? null,
        tipo: data.tipo ?? null,
        nombre: data.nombre ?? null,
        createdAt: data.createdAt && data.createdAt.toMillis ? data.createdAt.toMillis() : data.createdAt ?? null,
      };
    });

    return NextResponse.json({ success: true, items });
  } catch (error) {
    console.error("Error listing imagenes:", error);
    return NextResponse.json({ success: false, message: "No se pudo listar imágenes." }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = await requireAdminSession(request);
  if (unauthorized) return unauthorized;

  try {
    const { id } = await params;

    const body = await request.json();
    const { imageId, url, storagePath, tipo, nombre } = body;
    if (!url || !storagePath || !nombre) {
      return NextResponse.json({ success: false, message: "Datos incompletos." }, { status: 400 });
    }

    const docId = imageId || adminDb.collection("__temp").doc().id;
    const resolvedTipo = tipo ? String(tipo) : "galeria";

    await adminDb.collection("iglesias").doc(id).collection("imagenes").doc(docId).set({
      url: String(url),
      storagePath: String(storagePath),
      tipo: resolvedTipo,
      nombre: String(nombre),
      createdAt: FieldValue.serverTimestamp(),
    });

    // Denormalize the logo onto the iglesia doc so the directory listing
    // can render it without an extra subcollection read per card.
    if (resolvedTipo === "logo") {
      await adminDb.collection("iglesias").doc(id).update({
        logoUrl: String(url),
        logoPath: String(storagePath),
      });
    }

    return NextResponse.json({ success: true, id: docId }, { status: 201 });
  } catch (error) {
    console.error("Error creating imagen doc:", error);
    return NextResponse.json({ success: false, message: "No se pudo crear el documento de imagen." }, { status: 500 });
  }
}
