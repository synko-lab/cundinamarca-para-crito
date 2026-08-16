import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
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
