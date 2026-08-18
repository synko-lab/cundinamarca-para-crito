import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { deleteCloudinaryImage } from "@/lib/cloudinary-admin";
import { FieldValue } from "firebase-admin/firestore";
import { requireAdminSession } from "@/lib/admin-session";

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string; imageId: string }> }) {
  const unauthorized = await requireAdminSession(request);
  if (unauthorized) return unauthorized;

  const { id, imageId } = await params;
  try {
    const docRef = adminDb.collection("iglesias").doc(id).collection("imagenes").doc(imageId);
    const doc = await docRef.get();
    if (!doc.exists) return NextResponse.json({ success: false, message: "No encontrado." }, { status: 404 });
    const data: any = doc.data();
    const storagePath = data.storagePath;

    // Attempt to delete the file in Cloudinary first
    try {
      await deleteCloudinaryImage(String(storagePath));
    } catch (err) {
      console.error("Error deleting Cloudinary image:", err);
      return NextResponse.json({ success: false, message: "No se pudo eliminar la imagen en Cloudinary." }, { status: 500 });
    }

    try {
      await docRef.delete();
    } catch (err) {
      console.error("Error deleting firestore doc after storage deletion:", err);
      return NextResponse.json({ success: false, message: "Error eliminando registro en Firestore." }, { status: 500 });
    }

    // Clear the denormalized logo on the iglesia doc if this was the active one
    if (data.tipo === "logo") {
      const iglesiaRef = adminDb.collection("iglesias").doc(id);
      const iglesiaDoc = await iglesiaRef.get();
      if (iglesiaDoc.data()?.logoPath === storagePath) {
        await iglesiaRef.update({ logoUrl: FieldValue.delete(), logoPath: FieldValue.delete() });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting imagen:", error);
    return NextResponse.json({ success: false, message: "Error interno." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string; imageId: string }> }) {
  const unauthorized = await requireAdminSession(request);
  if (unauthorized) return unauthorized;

  // Replace image metadata after client uploads new file
  const { id, imageId } = await params;
  try {
    const body = await request.json();
    const { url: newUrl, storagePath: newStoragePath, nombre: newNombre, tipo: newTipo } = body;
    if (!newUrl || !newStoragePath) return NextResponse.json({ success: false, message: "Datos incompletos." }, { status: 400 });

    const docRef = adminDb.collection("iglesias").doc(id).collection("imagenes").doc(imageId);
    const doc = await docRef.get();
    if (!doc.exists) return NextResponse.json({ success: false, message: "No encontrado." }, { status: 404 });
    const oldData: any = doc.data();
    const oldStorage = oldData.storagePath;

    const resolvedTipo = newTipo ? String(newTipo) : oldData.tipo || "galeria";

    // Update document first
    await docRef.update({
      url: String(newUrl),
      storagePath: String(newStoragePath),
      nombre: newNombre ? String(newNombre) : oldData.nombre || "",
      tipo: resolvedTipo,
      updatedAt: FieldValue.serverTimestamp(),
    });

    if (resolvedTipo === "logo") {
      await adminDb.collection("iglesias").doc(id).update({
        logoUrl: String(newUrl),
        logoPath: String(newStoragePath),
      });
    }

    // Try to delete old file
    try {
      if (oldStorage && oldStorage !== newStoragePath) {
        await deleteCloudinaryImage(String(oldStorage));
      }
    } catch (err) {
      console.error("Error deleting old Cloudinary image:", err);
      // Do not fail operation – return warning
      return NextResponse.json({ success: true, warning: "No se pudo eliminar la imagen antigua en Cloudinary." });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error replacing imagen:", error);
    return NextResponse.json({ success: false, message: "Error interno." }, { status: 500 });
  }
}
