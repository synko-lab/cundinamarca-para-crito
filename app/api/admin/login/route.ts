import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, ADMIN_SESSION_MAX_AGE_SECONDS, constantTimeEqual, createSessionToken } from "@/lib/admin-session";

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS_PER_WINDOW = 5;

// Estado en memoria del proceso — suficiente para frenar fuerza bruta básica
// sin montar infraestructura extra. Se reinicia si el servidor se reinicia.
const attemptsByIp = new Map<string, { count: number; resetAt: number }>();

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = attemptsByIp.get(ip);
  if (!entry || now > entry.resetAt) {
    attemptsByIp.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_ATTEMPTS_PER_WINDOW;
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { success: false, message: "Demasiados intentos. Espera unos minutos antes de volver a intentar." },
      { status: 429 }
    );
  }

  let password: unknown;
  try {
    const body = await request.json();
    password = body?.password;
  } catch {
    return NextResponse.json({ success: false, message: "Solicitud inválida." }, { status: 400 });
  }

  const expected = process.env.ADMIN_ACCESS_CODE;
  if (!expected) {
    console.error("ADMIN_ACCESS_CODE no está configurado en el servidor.");
    return NextResponse.json({ success: false, message: "Configuración del servidor incompleta." }, { status: 500 });
  }

  if (typeof password !== "string" || !constantTimeEqual(password, expected)) {
    return NextResponse.json({ success: false, message: "Contraseña incorrecta." }, { status: 401 });
  }

  const token = await createSessionToken();
  const res = NextResponse.json({ success: true });
  res.cookies.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
  });
  return res;
}
