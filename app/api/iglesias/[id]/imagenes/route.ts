import { NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

async function verifyToken(request: Request) {
  const auth = request.headers.get("authorization") || request.headers.get("Authorization");
  if (!auth) return null;
  const parts = auth.split(" ");
  if (parts.length !== 2) return null;
  const token = parts[1];
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    return decoded;
  } catch (err) {
    return null;
  }
}

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
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

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const decoded = await verifyToken(request);
    if (!decoded) return NextResponse.json({ success: false, message: "No autorizado." }, { status: 401 });

    // Ensure user belongs to this iglesia
    const uid = decoded.uid as string;
    const userDoc = await adminDb.collection("users").doc(uid).get();
    if (!userDoc.exists) {
      return NextResponse.json({ success: false, message: "Usuario no asociado a ninguna iglesia." }, { status: 403 });
    }
    const userData: any = userDoc.data();
    if (!userData.iglesiaId || String(userData.iglesiaId) !== id) {
      return NextResponse.json({ success: false, message: "No tiene permisos para esta iglesia." }, { status: 403 });
    }

    const body = await request.json();
    const { imageId, url, storagePath, tipo, nombre } = body;
    if (!url || !storagePath || !nombre) {
      return NextResponse.json({ success: false, message: "Datos incompletos." }, { status: 400 });
    }

    const docId = imageId || adminDb.collection("__temp").doc().id;

    await adminDb.collection("iglesias").doc(id).collection("imagenes").doc(docId).set({
      url: String(url),
      storagePath: String(storagePath),
      tipo: tipo ? String(tipo) : "galeria",
      nombre: String(nombre),
      createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true, id: docId }, { status: 201 });
  } catch (error) {
    console.error("Error creating imagen doc:", error);
    return NextResponse.json({ success: false, message: "No se pudo crear el documento de imagen." }, { status: 500 });
  }
}
