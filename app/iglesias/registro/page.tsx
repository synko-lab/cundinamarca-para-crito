"use client";

import React, { useEffect, useState } from "react";
import { MUNICIPIOS, haversineDistanceKm } from "../../../lib/municipios";
import { uploadImageClient, getIdToken } from "../../../src/lib/storageClient";

type FormState = {
  nombre: string;
  pastor: string;
  telefono: string;
  email: string;
  municipio: string;
  direccion: string;
  barrio: string;
  denominacion: string;
  horarioCulto: string;
  descripcion: string;
  habitantesMunicipio: number | null;
  distanciaBosaCentroKm: number | null;
};

export default function RegistroIglesiaPage() {
  const [form, setForm] = useState<FormState>({
    nombre: "",
    pastor: "",
    telefono: "",
    email: "",
    municipio: "",
    direccion: "",
    barrio: "",
    denominacion: "",
    horarioCulto: "",
    descripcion: "",
    habitantesMunicipio: null,
    distanciaBosaCentroKm: null,
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [imagenFile, setImagenFile] = useState<File | null>(null);
  const [imagenTipo, setImagenTipo] = useState<string>("galeria");
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  useEffect(() => {
    // try to auto-fill habitantes/distancia from MUNICIPIOS
    const m = MUNICIPIOS.find((x) => x.nombre === form.municipio);
    if (m) {
      setForm((s) => ({
        ...s,
        habitantesMunicipio: m.habitantes ?? null,
        distanciaBosaCentroKm: null, // leave null unless coords available
      }));
    }
  }, [form.municipio]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((s) => ({ ...s, [key]: value }));
  }

  function validate() {
    if (!form.nombre.trim()) return "Nombre es obligatorio.";
    if (!form.pastor.trim()) return "Pastor/Líder es obligatorio.";
    if (!form.telefono.trim()) return "Teléfono es obligatorio.";
    if (!form.municipio.trim()) return "Municipio es obligatorio.";
    if (form.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) return "Email inválido.";
    if (form.habitantesMunicipio !== null && (!Number.isInteger(form.habitantesMunicipio) || form.habitantesMunicipio < 0)) return "Habitantes debe ser entero positivo.";
    if (form.distanciaBosaCentroKm !== null && (isNaN(form.distanciaBosaCentroKm) || form.distanciaBosaCentroKm < 0)) return "Distancia inválida.";
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    const v = validate();
    if (v) return setError(v);

    // If habitantes or distancia missing, warn user but allow submit
    if (form.habitantesMunicipio === null || form.distanciaBosaCentroKm === null) {
      const ok = confirm(
        "Algunos datos (habitantes o distancia) están pendientes. ¿Deseas continuar con el registro?"
      );
      if (!ok) return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/iglesias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: form.nombre,
          pastor: form.pastor,
          telefono: form.telefono,
          email: form.email,
          municipio: form.municipio,
          direccion: form.direccion,
          barrio: form.barrio,
          denominacion: form.denominacion,
          horarioCulto: form.horarioCulto,
          descripcion: form.descripcion,
          habitantesMunicipio: form.habitantesMunicipio,
          distanciaBosaCentroKm: form.distanciaBosaCentroKm,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Error en servidor");
      const iglesiaId = data.id;

      // If an image file was provided, upload it and store metadata
      if (imagenFile) {
        try {
          const uploadResult = await uploadImageClient(imagenFile, iglesiaId, (p) => setUploadProgress(p));
          const idToken = await getIdToken();
          if (!idToken) {
            setMessage("Iglesia registrada. Inicia sesión para guardar la imagen de la iglesia.");
          } else {
            const resImg = await fetch(`/api/iglesias/${iglesiaId}/imagenes`, {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
              body: JSON.stringify({
                imageId: uploadResult.imageId,
                url: uploadResult.downloadURL,
                storagePath: uploadResult.storagePath,
                tipo: imagenTipo,
                nombre: uploadResult.nombre,
              }),
            });
            const dataImg = await resImg.json();
            if (!resImg.ok) throw new Error(dataImg?.message || "Error guardando metadata de imagen");
            setMessage("Iglesia registrada correctamente y imagen subida.");
          }
        } catch (err: any) {
          console.error("Error subiendo imagen durante registro:", err);
          setError("Iglesia creada, pero ocurrió un error subiendo la imagen: " + (err?.message || String(err)));
        }
      } else {
        setMessage("Iglesia registrada correctamente.");
      }

      setForm({
        nombre: "",
        pastor: "",
        telefono: "",
        email: "",
        municipio: "",
        direccion: "",
        barrio: "",
        denominacion: "",
        horarioCulto: "",
        descripcion: "",
        habitantesMunicipio: null,
        distanciaBosaCentroKm: null,
      });
      setImagenFile(null);
      setImagenTipo("galeria");
      setUploadProgress(0);
    } catch (err: any) {
      setError(err?.message || "Error de red");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container">
      <div className="hero">
        <h1>Registrar Iglesia</h1>
        <p>Estamos construyendo el directorio de iglesias de Cundinamarca.</p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} className="form-grid" aria-label="Formulario de registro de iglesia">
          <div>
            <h3 className="section-title">Datos básicos</h3>
            <div className="form-row">
              <div>
                <label className="field">
                  <span className="label-text">Nombre <span className="required">*</span></span>
                  <input value={form.nombre} onChange={(e) => update("nombre", e.target.value)} />
                </label>
              </div>
              <div>
                <label className="field">
                  <span className="label-text">Pastor / Líder <span className="required">*</span></span>
                  <input value={form.pastor} onChange={(e) => update("pastor", e.target.value)} />
                </label>
              </div>
            </div>

            <div className="form-row">
              <div>
                <label className="field">
                  <span className="label-text">Teléfono <span className="required">*</span></span>
                  <input value={form.telefono} onChange={(e) => update("telefono", e.target.value)} />
                </label>
              </div>
              <div>
                <label className="field">
                  <span className="label-text">Correo</span>
                  <input value={form.email} onChange={(e) => update("email", e.target.value)} />
                </label>
              </div>
            </div>
          </div>

          <div>
            <h3 className="section-title">Ubicación</h3>
            <label className="field">
              <span className="label-text">Municipio <span className="required">*</span></span>
              <select value={form.municipio} onChange={(e) => update("municipio", e.target.value)}>
                <option value="">-- Seleccione municipio --</option>
                {MUNICIPIOS.map((m) => (
                  <option key={m.nombre} value={m.nombre}>
                    {m.nombre}
                  </option>
                ))}
              </select>
            </label>

            <div className="form-row" style={{ marginTop: 8 }}>
              <div>
                <label className="field">
                  <span className="label-text">Dirección</span>
                  <input value={form.direccion} onChange={(e) => update("direccion", e.target.value)} />
                </label>
              </div>
              <div>
                <label className="field">
                  <span className="label-text">Barrio / Vereda</span>
                  <input value={form.barrio} onChange={(e) => update("barrio", e.target.value)} />
                </label>
              </div>
            </div>
          </div>

          <div>
            <h3 className="section-title">Detalles</h3>
            <label className="field">
              <span className="label-text">Denominación</span>
              <select value={form.denominacion} onChange={(e) => update("denominacion", e.target.value)}>
                <option value="">-- Otra / seleccionar --</option>
                <option>Independiente</option>
                <option>Pentecostal</option>
                <option>Bautista</option>
                <option>Presbiteriana</option>
                <option>Metodista</option>
                <option>Cuadrangular</option>
                <option>Iglesia de Dios</option>
                <option>Otra</option>
              </select>
            </label>

            <label className="field">
              <span className="label-text">Horario de culto</span>
              <input value={form.horarioCulto} onChange={(e) => update("horarioCulto", e.target.value)} />
            </label>

            <label className="field">
              <span className="label-text">Descripción</span>
              <textarea value={form.descripcion} onChange={(e) => update("descripcion", e.target.value)} />
            </label>

            <label className="field">
              <span className="label-text">Imagen de la iglesia (opcional)</span>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input type="file" accept="image/*" onChange={(e) => setImagenFile(e.target.files ? e.target.files[0] : null)} />
                <select value={imagenTipo} onChange={(e) => setImagenTipo(e.target.value)}>
                  <option value="galeria">Galería</option>
                  <option value="logo">Logo</option>
                  <option value="portada">Portada</option>
                </select>
              </div>
              {uploadProgress > 0 && <div style={{ marginTop: 6 }}>Progreso: {uploadProgress}%</div>}
            </label>
          </div>

          <div>
            <h3 className="section-title">Datos del municipio / distancia</h3>
            <label className="field">
              <span className="label-text">Habitantes del municipio</span>
              <input
                type="number"
                value={form.habitantesMunicipio ?? ""}
                onChange={(e) => update("habitantesMunicipio", e.target.value === "" ? null : Number(e.target.value))}
                placeholder={form.habitantesMunicipio === null ? "Dato pendiente" : undefined}
              />
            </label>

            <label className="field">
              <span className="label-text">Distancia hasta Bosa Centro (km)</span>
              <input
                type="number"
                step="0.1"
                value={form.distanciaBosaCentroKm ?? ""}
                onChange={(e) => update("distanciaBosaCentroKm", e.target.value === "" ? null : Number(e.target.value))}
                placeholder={form.distanciaBosaCentroKm === null ? "Dato pendiente" : undefined}
              />
            </label>

            <p className="muted-note">Los valores pueden estar pendientes hasta que se completen los datos del municipio.</p>
          </div>

          <div className="actions">
            <button className="btn" type="submit" disabled={loading}>{loading ? "Registrando…" : "Registrar Iglesia"}</button>
            <button type="button" className="btn secondary" onClick={() => { setForm({ nombre: "", pastor: "", telefono: "", email: "", municipio: "", direccion: "", barrio: "", denominacion: "", horarioCulto: "", descripcion: "", habitantesMunicipio: null, distanciaBosaCentroKm: null }); setImagenFile(null); setImagenTipo("galeria"); setUploadProgress(0); }}>Limpiar</button>
            {message && <span className="success">{message}</span>}
            {error && <span className="error">{error}</span>}
          </div>
        </form>
      </div>
    </div>
  );
}
