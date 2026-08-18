"use client";

import { getAuth } from "firebase/auth";
import { app } from "./firebase";

export type UploadResult = {
  downloadURL: string;
  storagePath: string;
  imageId: string;
  nombre: string;
};

export async function uploadImageClient(file: File, iglesiaId: string, onProgress?: (p: number) => void, maxBytes = 5 * 1024 * 1024): Promise<UploadResult> {
  if (!file.type.startsWith("image/")) throw new Error("El archivo no es una imagen.");
  if (file.size > maxBytes) throw new Error("El archivo supera el tamaño máximo permitido.");

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  if (!cloudName || !uploadPreset) {
    throw new Error("Cloudinary no está configurado (faltan NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME / NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET).");
  }

  const imageId = (crypto && (crypto as any).randomUUID ? (crypto as any).randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`);
  const publicId = `iglesias/${iglesiaId}/imagenes/${imageId}`;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);
  formData.append("public_id", publicId);

  return new Promise<UploadResult>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`);

    xhr.upload.onprogress = (event) => {
      if (onProgress && event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          resolve({
            downloadURL: data.secure_url,
            storagePath: data.public_id,
            imageId,
            nombre: file.name,
          });
        } catch {
          reject(new Error("Respuesta inválida de Cloudinary."));
        }
      } else {
        reject(new Error(`Error subiendo la imagen (${xhr.status}).`));
      }
    };

    xhr.onerror = () => reject(new Error("Error de red subiendo la imagen."));
    xhr.send(formData);
  });
}

export async function getIdToken(): Promise<string | null> {
  const auth = getAuth(app);
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken();
}
