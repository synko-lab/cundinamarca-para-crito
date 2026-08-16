import { NextResponse } from "next/server";
import { adminDb, adminAuth, adminStorage } from "@/lib/firebase-admin";
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

export async function DELETE(_request: Request, { params }: { params: { id: string; imageId: string } }) {
  const { id, imageId } = params;
  try {
    const decoded = await verifyToken(_request);
    if (!decoded) return NextResponse.json({ success: false, message: "No autorizado." }, { status: 401 });

    const uid = decoded.uid as string;
    const userDoc = await adminDb.collection("users").doc(uid).get();
    if (!userDoc.exists || String(userDoc.data()?.iglesiaId) !== id) {
      return NextResponse.json({ success: false, message: "No tiene permisos." }, { status: 403 });
    }

    const docRef = adminDb.collection("iglesias").doc(id).collection("imagenes").doc(imageId);
    const doc = await docRef.get();
    if (!doc.exists) return NextResponse.json({ success: false, message: "No encontrado." }, { status: 404 });
    const data: any = doc.data();
    const storagePath = data.storagePath;

    // Attempt to delete storage file first
    try {
      const bucket = adminStorage.bucket(process.env.FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);
      await bucket.file(String(storagePath)).delete({ ignoreNotFound: true });
    } catch (err) {
      console.error("Error deleting storage file:", err);
      return NextResponse.json({ success: false, message: "No se pudo eliminar archivo en Storage." }, { status: 500 });
    }

    try {
      await docRef.delete();
    } catch (err) {
      console.error("Error deleting firestore doc after storage deletion:", err);
      return NextResponse.json({ success: false, message: "Error eliminando registro en Firestore." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting imagen:", error);
    return NextResponse.json({ success: false, message: "Error interno." }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string; imageId: string } }) {
  // Replace image metadata after client uploads new file
  const { id, imageId } = params;
  try {
    const decoded = await verifyToken(request);
    if (!decoded) return NextResponse.json({ success: false, message: "No autorizado." }, { status: 401 });

    const uid = decoded.uid as string;
    const userDoc = await adminDb.collection("users").doc(uid).get();
    if (!userDoc.exists || String(userDoc.data()?.iglesiaId) !== id) {
      return NextResponse.json({ success: false, message: "No tiene permisos." }, { status: 403 });
    }

    const body = await request.json();
    const { url: newUrl, storagePath: newStoragePath, nombre: newNombre, tipo: newTipo } = body;
    if (!newUrl || !newStoragePath) return NextResponse.json({ success: false, message: "Datos incompletos." }, { status: 400 });

    const docRef = adminDb.collection("iglesias").doc(id).collection("imagenes").doc(imageId);
    const doc = await docRef.get();
    if (!doc.exists) return NextResponse.json({ success: false, message: "No encontrado." }, { status: 404 });
    const oldData: any = doc.data();
    const oldStorage = oldData.storagePath;

    // Update document first
    await docRef.update({
      url: String(newUrl),
      storagePath: String(newStoragePath),
      nombre: newNombre ? String(newNombre) : oldData.nombre || "",
      tipo: newTipo ? String(newTipo) : oldData.tipo || "galeria",
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Try to delete old file
    try {
      const bucket = adminStorage.bucket(process.env.FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);
      if (oldStorage && oldStorage !== newStoragePath) {
        await bucket.file(String(oldStorage)).delete({ ignoreNotFound: true });
      }
    } catch (err) {
      console.error("Error deleting old storage file:", err);
      // Do not fail operation – return warning
      return NextResponse.json({ success: true, warning: "No se pudo eliminar archivo antiguo en Storage." });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error replacing imagen:", error);
    return NextResponse.json({ success: false, message: "Error interno." }, { status: 500 });
  }
}
