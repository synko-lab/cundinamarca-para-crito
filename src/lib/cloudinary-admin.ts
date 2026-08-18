import crypto from "crypto";

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

export async function deleteCloudinaryImage(publicId: string): Promise<void> {
  if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
    throw new Error("Cloudinary no está configurado en el servidor (CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET).");
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const signature = crypto
    .createHash("sha1")
    .update(`public_id=${publicId}&timestamp=${timestamp}${API_SECRET}`)
    .digest("hex");

  const body = new URLSearchParams({
    public_id: publicId,
    timestamp: String(timestamp),
    api_key: API_KEY,
    signature,
  });

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/destroy`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  const data = await res.json();
  if (data.result !== "ok" && data.result !== "not found") {
    throw new Error(`No se pudo eliminar la imagen en Cloudinary: ${data.result}`);
  }
}
