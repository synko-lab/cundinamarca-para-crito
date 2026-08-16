"use client";

import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { getAuth } from "firebase/auth";

export type UploadResult = {
  downloadURL: string;
  storagePath: string;
  imageId: string;
  nombre: string;
};

export async function uploadImageClient(file: File, iglesiaId: string, onProgress?: (p: number) => void, maxBytes = 5 * 1024 * 1024): Promise<UploadResult> {
  if (!file.type.startsWith("image/")) throw new Error("El archivo no es una imagen.");
  if (file.size > maxBytes) throw new Error("El archivo supera el tamaño máximo permitido.");

  const imageId = (crypto && (crypto as any).randomUUID ? (crypto as any).randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`);
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const storagePath = `iglesias/${iglesiaId}/imagenes/${imageId}.${ext}`;

  const storage = getStorage();
  const storageRef = ref(storage, storagePath);

  return new Promise<UploadResult>((resolve, reject) => {
    const uploadTask = uploadBytesResumable(storageRef, file as any);
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        if (onProgress && snapshot.totalBytes) {
          const percent = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          onProgress(percent);
        }
      },
      (error) => reject(error),
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve({ downloadURL, storagePath, imageId, nombre: file.name });
        } catch (err) {
          reject(err);
        }
      }
    );
  });
}

export async function getIdToken(): Promise<string | null> {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken();
}
