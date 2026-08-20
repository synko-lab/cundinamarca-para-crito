"use client";

import React, { useEffect, useState } from "react";
import { uploadImageClient } from "../../../src/lib/storageClient";

type FormState = {
  nombre: string;
  distanciaBosaCentroKm: string;
  distanciaBosaCentroHoras: string;
  distanciaBosaCentroMinutosResto: string;
  habitantes: string;
  extensionKm2: string;
  lat: string;
  lng: string;
};

const EMPTY_FORM: FormState = {
  nombre: "",
  distanciaBosaCentroKm: "",
  distanciaBosaCentroHoras: "",
  distanciaBosaCentroMinutosResto: "",
  habitantes: "",
  extensionKm2: "",
  lat: "",
  lng: "",
};

export default function MunicipioForm({ editId }: { editId?: string }) {
  const isEdit = Boolean(editId);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [bandera, setBandera] = useState<File | null>(null);
  const [banderaPreview, setBanderaPreview] = useState<string | null>(null);
  const [existingBanderaUrl, setExistingBanderaUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingRecord, setLoadingRecord] = useState(isEdit);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);

  const activeId = editId || createdId;

  useEffect(() => {
    if (!editId) return;
    setLoadingRecord(true);
    fetch(`/api/municipios/${editId}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.item) throw new Error(data?.message || "No se pudo cargar el municipio.");
        const it = data.item;
        const totalMinutos: number | null =
          it.distanciaBosaCentroMinutos === null || it.distanciaBosaCentroMinutos === undefined
            ? null
            : Number(it.distanciaBosaCentroMinutos);
        setForm({
          nombre: it.nombre ?? "",
          distanciaBosaCentroKm: it.distanciaBosaCentroKm ?? "",
          distanciaBosaCentroHoras: totalMinutos !== null ? String(Math.floor(totalMinutos / 60)) : "",
          distanciaBosaCentroMinutosResto: totalMinutos !== null ? String(Math.round(totalMinutos % 60)) : "",
          habitantes: it.habitantes ?? "",
          extensionKm2: it.extensionKm2 ?? "",
          lat: it.lat ?? "",
          lng: it.lng ?? "",
        });
        setExistingBanderaUrl(it.banderaUrl ?? null);
      })
      .catch((err) => setError(err?.message || String(err)))
      .finally(() => setLoadingRecord(false));
  }, [editId]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((s) => ({ ...s, [key]: value }));
  }

  function handleBanderaChange(file: File | null) {
    setBandera(file);
    if (banderaPreview) URL.revokeObjectURL(banderaPreview);
    setBanderaPreview(file ? URL.createObjectURL(file) : null);
  }

  function handleAddNew() {
    setForm(EMPTY_FORM);
    handleBanderaChange(null);
    setExistingBanderaUrl(null);
    setCreatedId(null);
    setError(null);
    setMessage(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!form.nombre.trim()) {
      setError("El nombre del municipio es obligatorio.");
      return;
    }

    setLoading(true);
    try {
      let banderaUrl: string | null = null;
      let banderaPath: string | null = null;

      if (bandera) {
        const tempId = activeId || `municipio-${Date.now()}`;
        const uploadResult = await uploadImageClient(bandera, tempId);
        banderaUrl = uploadResult.downloadURL;
        banderaPath = uploadResult.storagePath;
      }

      const horas = form.distanciaBosaCentroHoras.trim() ? Number(form.distanciaBosaCentroHoras) : 0;
      const minutosResto = form.distanciaBosaCentroMinutosResto.trim() ? Number(form.distanciaBosaCentroMinutosResto) : 0;
      const distanciaBosaCentroMinutos =
        form.distanciaBosaCentroHoras.trim() || form.distanciaBosaCentroMinutosResto.trim()
          ? String(horas * 60 + minutosResto)
          : "";

      const payload = {
        nombre: form.nombre,
        distanciaBosaCentroKm: form.distanciaBosaCentroKm,
        distanciaBosaCentroMinutos,
        habitantes: form.habitantes,
        extensionKm2: form.extensionKm2,
        lat: form.lat,
        lng: form.lng,
        ...(banderaUrl ? { banderaUrl, banderaPath } : {}),
      };

      if (editId) {
        const res = await fetch(`/api/municipios/${editId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || "Error en servidor");
        if (banderaUrl) setExistingBanderaUrl(banderaUrl);
        handleBanderaChange(null);
        setMessage("Cambios guardados correctamente.");
      } else {
        const res = await fetch("/api/municipios", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || "Error en servidor");
        setCreatedId(data.id);
        if (banderaUrl) setExistingBanderaUrl(banderaUrl);
        handleBanderaChange(null);
        setMessage("Municipio registrado correctamente.");
      }
    } catch (err: any) {
      setError(err?.message || "Error de red");
    } finally {
      setLoading(false);
    }
  }

  if (loadingRecord) {
    return <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-400 shadow-sm">Cargando…</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="grid grid-cols-1 gap-5">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">
            Nombre <span className="text-[#CE1126]">*</span>
          </span>
          <input
            value={form.nombre}
            onChange={(e) => update("nombre", e.target.value)}
            placeholder="Nombre del municipio"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-[#003893] focus:outline-none focus:ring-4 focus:ring-[#003893]/10"
          />
        </label>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">Habitantes</span>
            <input
              type="number"
              value={form.habitantes}
              onChange={(e) => update("habitantes", e.target.value)}
              placeholder="Dato pendiente"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-[#003893] focus:outline-none focus:ring-4 focus:ring-[#003893]/10"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">Extensión (km²)</span>
            <input
              type="number"
              step="0.1"
              value={form.extensionKm2}
              onChange={(e) => update("extensionKm2", e.target.value)}
              placeholder="Dato pendiente"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-[#003893] focus:outline-none focus:ring-4 focus:ring-[#003893]/10"
            />
          </label>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">Distancia a Bosa Centro (km)</span>
            <input
              type="number"
              step="0.1"
              value={form.distanciaBosaCentroKm}
              onChange={(e) => update("distanciaBosaCentroKm", e.target.value)}
              placeholder="Dato pendiente"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-[#003893] focus:outline-none focus:ring-4 focus:ring-[#003893]/10"
            />
          </label>
          <div className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">Distancia a Bosa Centro (tiempo)</span>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={form.distanciaBosaCentroHoras}
                  onChange={(e) => update("distanciaBosaCentroHoras", e.target.value)}
                  placeholder="0"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-[#003893] focus:outline-none focus:ring-4 focus:ring-[#003893]/10"
                />
                <span className="mt-1 block text-xs text-slate-400">Horas</span>
              </div>
              <div className="flex-1">
                <input
                  type="number"
                  min="0"
                  max="59"
                  step="1"
                  value={form.distanciaBosaCentroMinutosResto}
                  onChange={(e) => update("distanciaBosaCentroMinutosResto", e.target.value)}
                  placeholder="0"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-[#003893] focus:outline-none focus:ring-4 focus:ring-[#003893]/10"
                />
                <span className="mt-1 block text-xs text-slate-400">Minutos</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">Latitud</span>
            <input
              type="number"
              step="0.000001"
              value={form.lat}
              onChange={(e) => update("lat", e.target.value)}
              placeholder="4.6xxxxx"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-[#003893] focus:outline-none focus:ring-4 focus:ring-[#003893]/10"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">Longitud</span>
            <input
              type="number"
              step="0.000001"
              value={form.lng}
              onChange={(e) => update("lng", e.target.value)}
              placeholder="-74.0xxxxx"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-[#003893] focus:outline-none focus:ring-4 focus:ring-[#003893]/10"
            />
          </label>
        </div>
        <p className="-mt-3 text-xs text-slate-400">
          Sin coordenadas, el municipio no aparecerá marcado en el mapa (pero sí en su perfil).
        </p>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">Bandera del municipio</span>
          <div className="flex items-center gap-3">
            <label className="flex-1 cursor-pointer rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500 transition hover:border-[#003893] hover:bg-blue-50/40">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleBanderaChange(e.target.files ? e.target.files[0] : null)}
              />
              {bandera ? bandera.name : existingBanderaUrl ? "Haz clic para cambiar la imagen" : "Haz clic para elegir una imagen"}
            </label>
            {(banderaPreview || existingBanderaUrl) && (
              <img
                src={banderaPreview || existingBanderaUrl || ""}
                alt="Vista previa"
                className="h-16 w-16 rounded-lg border border-slate-200 object-cover"
              />
            )}
          </div>
        </label>
      </div>

      {error && <p className="mt-5 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {message && <p className="mt-5 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p>}

      <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-6">
        {!isEdit && createdId && (
          <button
            type="button"
            onClick={handleAddNew}
            className="rounded-lg border border-[#003893] px-5 py-2.5 text-sm font-semibold text-[#003893] shadow-sm transition hover:bg-blue-50"
          >
            Agregar nuevo
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-[#003893] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#002d75] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Guardando…" : isEdit ? "Guardar cambios" : "Registrar Municipio"}
        </button>
      </div>
    </form>
  );
}
