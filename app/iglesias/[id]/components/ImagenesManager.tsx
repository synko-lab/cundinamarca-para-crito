"use client";

import React, { useEffect, useState } from "react";
import { uploadImageClient, getIdToken } from "@/src/lib/storageClient";

type Imagen = {
  id: string;
  url: string;
  storagePath: string;
  tipo: string;
  nombre: string;
  createdAt: number | null;
};

export default function ImagenesManager({ iglesiaId }: { iglesiaId: string }) {
  const [images, setImages] = useState<Imagen[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [tipo, setTipo] = useState<string>("galeria");
  const [progress, setProgress] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchImages();
  }, []);

  async function fetchImages() {
    try {
      const res = await fetch(`/api/iglesias/${iglesiaId}/imagenes`);
      const data = await res.json();
      if (data.success) setImages(data.items || []);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleUpload(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    if (!file) return setError("Selecciona un archivo.");

    setLoading(true);
    try {
      const result = await uploadImageClient(file, iglesiaId, (p) => setProgress(p));
      const idToken = await getIdToken();
      if (!idToken) throw new Error("Usuario no autenticado.");

      const res = await fetch(`/api/iglesias/${iglesiaId}/imagenes`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({
          imageId: result.imageId,
          url: result.downloadURL,
          storagePath: result.storagePath,
          tipo,
          nombre: result.nombre,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Error creando documento");
      setFile(null);
      setProgress(0);
      fetchImages();
    } catch (err: any) {
      setError(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(imageId: string) {
    if (!confirm("Eliminar imagen?")) return;
    try {
      const idToken = await getIdToken();
      if (!idToken) throw new Error("Usuario no autenticado.");
      const res = await fetch(`/api/iglesias/${iglesiaId}/imagenes/${imageId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Error eliminando");
      fetchImages();
    } catch (err: any) {
      setError(err?.message || String(err));
    }
  }

  return (
    <div style={{ marginTop: 18 }}>
      <h3>Imágenes</h3>

      <form onSubmit={handleUpload} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)} />
        <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
          <option value="galeria">Galería</option>
          <option value="logo">Logo</option>
          <option value="portada">Portada</option>
        </select>
        <button type="submit" disabled={loading}>{loading ? `Subiendo ${progress}%` : "Subir"}</button>
      </form>

      {error && <div style={{ color: "red" }}>{error}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px,1fr))", gap: 12 }}>
        {images.map((img) => (
          <div key={img.id} style={{ border: "1px solid #eee", padding: 8, borderRadius: 8 }}>
            <div style={{ width: "100%", height: 120, background: "#f3f3f3", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {img.url ? <img src={img.url} alt={img.nombre} style={{ maxWidth: "100%", maxHeight: "100%" }} /> : <span>No image</span>}
            </div>
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 12, color: "#333" }}>{img.nombre}</div>
              <div style={{ fontSize: 12, color: "#666" }}>{img.tipo}</div>
              <div style={{ marginTop: 6, display: "flex", gap: 8 }}>
                <button onClick={() => handleDelete(img.id)}>Eliminar</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
