import { NextRequest, NextResponse } from "next/server";

export const ADMIN_SESSION_COOKIE = "admin_session";
export const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 90; // 90 días

function getSigningMaterial(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  const code = process.env.ADMIN_ACCESS_CODE;
  if (!secret || !code) {
    throw new Error("ADMIN_SESSION_SECRET y ADMIN_ACCESS_CODE deben estar configurados.");
  }
  // Mezclar ambos valores en la clave de firma: cambiar cualquiera de los dos
  // invalida automáticamente todas las cookies de sesión emitidas antes.
  return `${secret}::${code}`;
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(value: string): Uint8Array {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function getHmacKey(): Promise<CryptoKey> {
  const material = new TextEncoder().encode(getSigningMaterial());
  return crypto.subtle.importKey("raw", material, { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

/** Crea un token de sesión firmado (payload.firma), sin guardar estado en el servidor. */
export async function createSessionToken(): Promise<string> {
  const exp = Date.now() + ADMIN_SESSION_MAX_AGE_SECONDS * 1000;
  const payloadB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify({ exp })));
  const key = await getHmacKey();
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payloadB64));
  return `${payloadB64}.${base64UrlEncode(new Uint8Array(signature))}`;
}

/** Verifica la firma y la expiración del token. No confía en nada que no esté firmado por el servidor. */
export async function verifySessionToken(token: string | undefined | null): Promise<boolean> {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [payloadB64, sigB64] = parts;

  try {
    const key = await getHmacKey();
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      base64UrlDecode(sigB64) as BufferSource,
      new TextEncoder().encode(payloadB64) as BufferSource
    );
    if (!valid) return false;

    const payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(payloadB64)));
    return typeof payload.exp === "number" && Date.now() <= payload.exp;
  } catch {
    return false;
  }
}

/** Comparación en tiempo constante — evita que un atacante infiera la contraseña por temporización. */
export function constantTimeEqual(a: string, b: string): boolean {
  const maxLen = Math.max(a.length, b.length);
  let diff = a.length === b.length ? 0 : 1;
  for (let i = 0; i < maxLen; i++) {
    diff |= (i < a.length ? a.charCodeAt(i) : 0) ^ (i < b.length ? b.charCodeAt(i) : 0);
  }
  return diff === 0;
}

/** Guard para usar al inicio de route handlers que mutan datos. Devuelve 401 si no hay sesión válida. */
export async function requireAdminSession(request: NextRequest): Promise<NextResponse | null> {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const valid = await verifySessionToken(token);
  if (!valid) {
    return NextResponse.json({ success: false, message: "No autorizado." }, { status: 401 });
  }
  return null;
}
