import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET() {
  try {
    const snapshot = await adminDb.collection("iglesias").limit(1).get();

    return NextResponse.json({
      success: true,
      message: "Firebase Admin funciona correctamente",
      documents: snapshot.size,
    });
  } catch (error) {
    console.error("Firebase Admin error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Firebase Admin no pudo conectarse",
      },
      { status: 500 }
    );
  }
}
