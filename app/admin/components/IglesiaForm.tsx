"use client";

import React, { useEffect, useMemo, useState } from "react";
import { MUNICIPIOS } from "../../../lib/municipios";
import { type Imagen } from "../../iglesias/[id]/components/IglesiaHero";
import { uploadImageClient } from "../../../src/lib/storageClient";
import {
  DIAS_SEMANA,
  emptyHorarios,
  normalizeHorarios,
  cleanHorariosForSave,
  newSlotId,
  type HorariosSemana,
} from "../../../src/lib/horarios";
import { PlusIcon, TrashMiniIcon } from "./form-icons";

type FormState = {
  nombre: string;
  pastor: string;
  telefono: string;
  email: string;
  municipio: string;
  direccion: string;
  barrio: string;
  descripcion: string;
};

const EMPTY_FORM: FormState = {
  nombre: "",
  pastor: "",
  telefono: "",
  email: "",
  municipio: "",
  direccion: "",
  barrio: "",
  descripcion: "",
};

const STEPS = [
  { title: "Datos básicos", description: "Información de contacto" },
  { title: "Ubicación", description: "Dónde se encuentra" },
  { title: "Detalles", description: "Datos adicionales" },
  { title: "Revisión", description: "Confirma y envía" },
  { title: "Imágenes", description: "Logo, portada y galería" },
];
const REVIEW_STEP = 3;
const IMAGES_STEP = 4;

export default function IglesiaForm({ editId }: { editId?: string }) {
  const isEdit = Boolean(editId);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [horarios, setHorarios] = useState<HorariosSemana>(emptyHorarios());
  const [step, setStep] = useState(0);
  const [loadingRecord, setLoadingRecord] = useState(isEdit);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stepError, setStepError] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);

  const [images, setImages] = useState<Imagen[]>([]);
  const activeId = editId || createdId;

  // Imágenes "en espera": no se suben hasta pulsar Guardar en la pestaña final.
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [portadaFile, setPortadaFile] = useState<File | null>(null);
  const [portadaPreview, setPortadaPreview] = useState<string | null>(null);
  const [galeriaStaged, setGaleriaStaged] = useState<{ file: File; preview: string }[]>([]);
  const [saving, setSaving] = useState(false);

  function stageLogo(file: File | null) {
    if (logoPreview) URL.revokeObjectURL(logoPreview);
    setLogoFile(file);
    setLogoPreview(file ? URL.createObjectURL(file) : null);
  }

  function stagePortada(file: File | null) {
    if (portadaPreview) URL.revokeObjectURL(portadaPreview);
    setPortadaFile(file);
    setPortadaPreview(file ? URL.createObjectURL(file) : null);
  }

  function stageGaleriaFiles(files: FileList | null) {
    if (!files) return;
    const nuevos = Array.from(files).map((file) => ({ file, preview: URL.createObjectURL(file) }));
    setGaleriaStaged((prev) => [...prev, ...nuevos]);
  }

  function unstageGaleriaFile(index: number) {
    setGaleriaStaged((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  }

  async function handleDeleteExisting(imageId: string) {
    if (!activeId) return;
    if (!confirm("¿Eliminar esta imagen?")) return;
    try {
      const res = await fetch(`/api/iglesias/${activeId}/imagenes/${imageId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "No se pudo eliminar.");
      refreshImages(activeId);
    } catch (err: any) {
      setError(err?.message || String(err));
    }
  }

  useEffect(() => {
    if (!editId) return;
    setLoadingRecord(true);
    fetch(`/api/iglesias/${editId}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.item) throw new Error(data?.message || "No se pudo cargar la iglesia.");
        const it = data.item;
        setForm({
          nombre: it.nombre ?? "",
          pastor: it.pastor ?? "",
          telefono: it.telefono ?? "",
          email: it.email ?? "",
          municipio: it.municipio ?? "",
          direccion: it.direccion ?? "",
          barrio: it.barrio ?? "",
          descripcion: it.descripcion ?? "",
        });
        setHorarios(normalizeHorarios(it.horarios));
      })
      .catch((err) => setError(err?.message || String(err)))
      .finally(() => setLoadingRecord(false));
  }, [editId]);

  function refreshImages(id: string) {
    fetch(`/api/iglesias/${id}/imagenes`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setImages(data.items || []);
      })
      .catch((err) => console.error(err));
  }

  useEffect(() => {
    if (activeId) refreshImages(activeId);
  }, [activeId]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((s) => ({ ...s, [key]: value }));
  }

  function handleAddNew() {
    setForm(EMPTY_FORM);
    setHorarios(emptyHorarios());
    setStep(0);
    setStepError(null);
    setError(null);
    setMessage(null);
    setCreatedId(null);
    setImages([]);
    stageLogo(null);
    stagePortada(null);
    setGaleriaStaged((prev) => {
      prev.forEach((p) => URL.revokeObjectURL(p.preview));
      return [];
    });
  }

  function addSlot(dia: string) {
    setHorarios((h) => ({ ...h, [dia]: [...(h[dia] || []), { id: newSlotId(), titulo: "", horaInicio: "", horaFin: "" }] }));
  }

  function updateSlot(dia: string, id: string, patch: Partial<{ titulo: string; horaInicio: string; horaFin: string }>) {
    setHorarios((h) => ({ ...h, [dia]: (h[dia] || []).map((s) => (s.id === id ? { ...s, ...patch } : s)) }));
  }

  function removeSlot(dia: string, id: string) {
    setHorarios((h) => ({ ...h, [dia]: (h[dia] || []).filter((s) => s.id !== id) }));
  }

  function validateStep(target: number): string | null {
    if (target === 0) {
      if (!form.nombre.trim()) return "Nombre es obligatorio.";
      if (!form.pastor.trim()) return "Pastor/Líder es obligatorio.";
      if (!form.telefono.trim()) return "Teléfono es obligatorio.";
    }
    if (target === 1) {
      if (!form.municipio.trim()) return "Municipio es obligatorio.";
    }
    return null;
  }

  function validateAll(): string | null {
    return validateStep(0) || validateStep(1);
  }

  function goNext() {
    const v = validateStep(step);
    if (v) {
      setStepError(v);
      return;
    }
    setStepError(null);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function goBack() {
    setStepError(null);
    setStep((s) => Math.max(s - 1, 0));
  }

  function goToStep(target: number) {
    if (target <= step) {
      setStepError(null);
      setStep(target);
      return;
    }
    for (let i = step; i < target; i++) {
      const v = validateStep(i);
      if (v) {
        setStepError(v);
        setStep(i);
        return;
      }
    }
    setStepError(null);
    setStep(target);
  }

  function handleFormNav(e: React.FormEvent) {
    e.preventDefault();
    if (step < IMAGES_STEP) goNext();
  }

  async function uploadStaged(id: string, file: File, tipo: "logo" | "portada" | "galeria") {
    const result = await uploadImageClient(file, id);
    await fetch(`/api/iglesias/${id}/imagenes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        imageId: result.imageId,
        url: result.downloadURL,
        storagePath: result.storagePath,
        tipo,
        nombre: result.nombre,
      }),
    });
  }

  async function handleSaveAll() {
    setError(null);
    setMessage(null);

    const v = validateAll();
    if (v) {
      setStepError(v);
      setStep(validateStep(0) ? 0 : 1);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        nombre: form.nombre,
        pastor: form.pastor,
        telefono: form.telefono,
        email: form.email,
        municipio: form.municipio,
        direccion: form.direccion,
        barrio: form.barrio,
        descripcion: form.descripcion,
        horarios: cleanHorariosForSave(horarios),
      };

      let id = activeId;
      if (id) {
        const res = await fetch(`/api/iglesias/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || "Error en servidor");
      } else {
        const res = await fetch("/api/iglesias", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || "Error en servidor");
        id = String(data.id);
        setCreatedId(id);
      }

      if (!id) throw new Error("No se pudo determinar el ID de la iglesia.");

      if (logoFile) await uploadStaged(id, logoFile, "logo");
      if (portadaFile) await uploadStaged(id, portadaFile, "portada");
      for (const item of galeriaStaged) {
        await uploadStaged(id, item.file, "galeria");
      }

      stageLogo(null);
      stagePortada(null);
      setGaleriaStaged((prev) => {
        prev.forEach((p) => URL.revokeObjectURL(p.preview));
        return [];
      });

      await refreshImages(id);
      setMessage("Guardado correctamente.");
    } catch (err: any) {
      setError(err?.message || "Error de red");
    } finally {
      setSaving(false);
    }
  }

  if (loadingRecord) {
    return <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-400 shadow-sm">Cargando…</div>;
  }

  if (step === IMAGES_STEP) {
    const existingLogo = images.filter((i) => i.tipo === "logo").sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))[0] ?? null;
    const existingPortada = images.filter((i) => i.tipo === "portada").sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))[0] ?? null;
    const existingGaleria = images.filter((i) => i.tipo === "galeria").sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));

    return (
      <>
        <Stepper steps={STEPS} current={step} onStepClick={goToStep} />

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-900">{STEPS[step].title}</h2>
            <p className="text-sm text-slate-500">Selecciona las imágenes; se suben todas al presionar Guardar.</p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <span className="mb-1.5 block text-sm font-medium text-slate-700">Logo</span>
              <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3 transition hover:border-emerald-500 hover:bg-emerald-50/50">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => stageLogo(e.target.files ? e.target.files[0] : null)}
                />
                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white">
                  {logoPreview || existingLogo ? (
                    <img src={logoPreview || existingLogo!.url} alt="Logo" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-xs text-slate-300">Sin logo</span>
                  )}
                </div>
                <span className="text-sm text-slate-500">
                  {logoFile ? logoFile.name : existingLogo ? "Haz clic para cambiar" : "Haz clic para elegir"}
                </span>
              </label>
              {logoFile && <p className="mt-1 text-xs text-amber-600">Pendiente de guardar</p>}
            </div>

            <div>
              <span className="mb-1.5 block text-sm font-medium text-slate-700">Portada</span>
              <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3 transition hover:border-emerald-500 hover:bg-emerald-50/50">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => stagePortada(e.target.files ? e.target.files[0] : null)}
                />
                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white">
                  {portadaPreview || existingPortada ? (
                    <img src={portadaPreview || existingPortada!.url} alt="Portada" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-xs text-slate-300">Sin portada</span>
                  )}
                </div>
                <span className="text-sm text-slate-500">
                  {portadaFile ? portadaFile.name : existingPortada ? "Haz clic para cambiar" : "Haz clic para elegir"}
                </span>
              </label>
              {portadaFile && <p className="mt-1 text-xs text-amber-600">Pendiente de guardar</p>}
            </div>
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">Galería</span>
              <label className="cursor-pointer rounded-lg bg-emerald-700 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-800">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    stageGaleriaFiles(e.target.files);
                    e.target.value = "";
                  }}
                />
                + Agregar fotos
              </label>
            </div>

            {existingGaleria.length === 0 && galeriaStaged.length === 0 ? (
              <div className="mt-3 rounded-lg border border-dashed border-slate-300 px-6 py-8 text-center text-sm text-slate-400">
                Aún no hay fotos en la galería.
              </div>
            ) : (
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {existingGaleria.map((img) => (
                  <div key={img.id} className="group relative overflow-hidden rounded-lg border border-slate-200">
                    <div className="flex h-28 w-full items-center justify-center bg-slate-100">
                      <img src={img.url} alt={img.nombre} className="h-full w-full object-cover" />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteExisting(img.id)}
                      className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition group-hover:opacity-100"
                      title="Eliminar"
                    >
                      <TrashMiniIcon className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {galeriaStaged.map((item, i) => (
                  <div key={i} className="group relative overflow-hidden rounded-lg border-2 border-dashed border-amber-300">
                    <div className="flex h-28 w-full items-center justify-center bg-slate-100">
                      <img src={item.preview} alt="" className="h-full w-full object-cover" />
                    </div>
                    <span className="absolute left-1.5 top-1.5 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                      Pendiente
                    </span>
                    <button
                      type="button"
                      onClick={() => unstageGaleriaFile(i)}
                      className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition group-hover:opacity-100"
                      title="Quitar"
                    >
                      <TrashMiniIcon className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {stepError && <p className="mt-5 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{stepError}</p>}
          {error && <p className="mt-5 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          {message && <p className="mt-5 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p>}

          <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-6">
            <button
              type="button"
              onClick={() => setStep(REVIEW_STEP)}
              className="rounded-lg px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
            >
              Atrás
            </button>
            <div className="flex items-center gap-3">
              {!isEdit && createdId && (
                <button
                  type="button"
                  onClick={handleAddNew}
                  className="rounded-lg border border-emerald-700 px-5 py-2.5 text-sm font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-50"
                >
                  Agregar nuevo
                </button>
              )}
              <button
                type="button"
                onClick={handleSaveAll}
                disabled={saving}
                className="rounded-lg bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Guardando…" : isEdit || createdId ? "Guardar cambios" : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Stepper steps={STEPS} current={step} onStepClick={goToStep} />

      <form
        onSubmit={handleFormNav}
        aria-label={isEdit ? "Formulario de edición de iglesia" : "Formulario de registro de iglesia"}
        className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
      >
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-slate-900">{STEPS[step].title}</h2>
          <p className="text-sm text-slate-500">{STEPS[step].description}</p>
        </div>

        {step === 0 && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field label="Nombre" required>
              <Input value={form.nombre} onChange={(v) => update("nombre", v)} placeholder="Nombre de la iglesia" />
            </Field>
            <Field label="Pastor / Líder" required>
              <Input value={form.pastor} onChange={(v) => update("pastor", v)} placeholder="Nombre del pastor o líder" />
            </Field>
            <Field label="Teléfono" required>
              <Input value={form.telefono} onChange={(v) => update("telefono", v)} placeholder="300 000 0000" />
            </Field>
            <Field label="Correo">
              <Input value={form.email} onChange={(v) => update("email", v)} placeholder="correo@ejemplo.com" type="text" />
            </Field>
          </div>
        )}

        {step === 1 && (
          <div className="grid grid-cols-1 gap-5">
            <Field label="Municipio" required>
              <select
                value={form.municipio}
                onChange={(e) => update("municipio", e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-emerald-600 focus:outline-none focus:ring-4 focus:ring-emerald-600/10"
              >
                <option value="">-- Seleccione municipio --</option>
                {MUNICIPIOS.map((m) => (
                  <option key={m.nombre} value={m.nombre}>
                    {m.nombre}
                  </option>
                ))}
              </select>
            </Field>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field label="Dirección">
                <Input value={form.direccion} onChange={(v) => update("direccion", v)} placeholder="Calle 00 # 00-00" />
              </Field>
              <Field label="Barrio / Vereda">
                <Input value={form.barrio} onChange={(v) => update("barrio", v)} placeholder="Nombre del barrio o vereda" />
              </Field>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="grid grid-cols-1 gap-5">
            <div>
              <span className="mb-1.5 block text-sm font-medium text-slate-700">Horarios</span>
              <p className="mb-3 text-xs text-slate-400">
                Agrega uno o más horarios por día. Cada uno lleva un título (ej. "Culto General"), hora de inicio y hora de cierre.
              </p>
              <div className="space-y-2">
                {DIAS_SEMANA.map((dia) => (
                  <DiaHorarioEditor
                    key={dia}
                    dia={dia}
                    slots={horarios[dia] || []}
                    onAdd={() => addSlot(dia)}
                    onUpdate={(id, patch) => updateSlot(dia, id, patch)}
                    onRemove={(id) => removeSlot(dia, id)}
                  />
                ))}
              </div>
            </div>

            <Field label="Descripción">
              <textarea
                value={form.descripcion}
                onChange={(e) => update("descripcion", e.target.value)}
                rows={4}
                className="w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-emerald-600 focus:outline-none focus:ring-4 focus:ring-emerald-600/10"
                placeholder="Cuéntanos brevemente sobre la iglesia"
              />
            </Field>
          </div>
        )}

        {step === 3 && <ReviewSummary form={form} horarios={horarios} />}

        {stepError && <p className="mt-5 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{stepError}</p>}
        {error && <p className="mt-5 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        {message && <p className="mt-5 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p>}

        <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-6">
          <button
            type="button"
            onClick={goBack}
            disabled={step === 0}
            className="rounded-lg px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Atrás
          </button>

          <button
            type="button"
            onClick={goNext}
            className="rounded-lg bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800"
          >
            Siguiente
          </button>
        </div>
      </form>
    </>
  );
}

function Stepper({
  steps,
  current,
  onStepClick,
}: {
  steps: { title: string; description: string }[];
  current: number;
  onStepClick: (index: number) => void;
}) {
  return (
    <ol className="flex items-center justify-between">
      {steps.map((s, i) => {
        const isDone = i < current;
        const isActive = i === current;
        return (
          <li key={s.title} className="flex flex-1 items-center last:flex-none">
            <button
              type="button"
              onClick={() => onStepClick(i)}
              className="flex flex-col items-center gap-1.5 focus:outline-none"
            >
              <span
                className={[
                  "flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition",
                  isDone
                    ? "bg-emerald-700 text-white"
                    : isActive
                    ? "border-2 border-emerald-700 text-emerald-700"
                    : "border-2 border-slate-200 text-slate-400",
                ].join(" ")}
              >
                {isDone ? "✓" : i + 1}
              </span>
              <span
                className={[
                  "hidden text-xs font-medium sm:block",
                  isActive || isDone ? "text-slate-900" : "text-slate-400",
                ].join(" ")}
              >
                {s.title}
              </span>
            </button>
            {i < steps.length - 1 && (
              <span
                className={["mx-2 h-0.5 flex-1 rounded transition sm:mx-3", isDone ? "bg-emerald-700" : "bg-slate-200"].join(" ")}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {label} {required && <span className="text-emerald-700">*</span>}
      </span>
      {children}
    </label>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  type = "text",
  step,
}: {
  value: string | number;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  step?: string;
}) {
  return (
    <input
      type={type}
      step={step}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none focus:ring-4 focus:ring-emerald-600/10"
    />
  );
}

function ReviewSummary({ form, horarios }: { form: FormState; horarios: HorariosSemana }) {
  const rows = useMemo(
    () => [
      { label: "Nombre", value: form.nombre },
      { label: "Pastor / Líder", value: form.pastor },
      { label: "Teléfono", value: form.telefono },
      { label: "Correo", value: form.email || "—" },
      { label: "Municipio", value: form.municipio },
      { label: "Dirección", value: form.direccion || "—" },
      { label: "Barrio / Vereda", value: form.barrio || "—" },
    ],
    [form]
  );

  const diasConHorario = DIAS_SEMANA.filter((d) => (horarios[d] || []).length > 0);

  return (
    <div className="space-y-4">
      <dl className="divide-y divide-slate-100 rounded-lg border border-slate-200">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between gap-4 px-4 py-2.5 text-sm">
            <dt className="text-slate-500">{r.label}</dt>
            <dd className="text-right font-medium text-slate-900">{String(r.value)}</dd>
          </div>
        ))}
        {form.descripcion && (
          <div className="px-4 py-2.5 text-sm">
            <dt className="mb-1 text-slate-500">Descripción</dt>
            <dd className="text-slate-900">{form.descripcion}</dd>
          </div>
        )}
      </dl>

      <div className="rounded-lg border border-slate-200 px-4 py-3">
        <div className="mb-2 text-sm font-medium text-slate-700">Horarios</div>
        {diasConHorario.length === 0 ? (
          <p className="text-sm text-slate-400">Sin horarios agregados.</p>
        ) : (
          <div className="space-y-2">
            {diasConHorario.map((dia) => (
              <div key={dia} className="text-sm">
                <span className="font-semibold text-slate-900">{dia}: </span>
                <span className="text-slate-600">
                  {(horarios[dia] || [])
                    .map((s) => {
                      const rango = [s.horaInicio, s.horaFin].filter(Boolean).join(" – ");
                      return [s.titulo, rango].filter(Boolean).join(" · ");
                    })
                    .filter(Boolean)
                    .join(" — ")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DiaHorarioEditor({
  dia,
  slots,
  onAdd,
  onUpdate,
  onRemove,
}: {
  dia: string;
  slots: { id: string; titulo: string; horaInicio: string; horaFin: string }[];
  onAdd: () => void;
  onUpdate: (id: string, patch: Partial<{ titulo: string; horaInicio: string; horaFin: string }>) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="rounded-xl border border-slate-200 p-3.5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-900">{dia}</span>
        <button
          type="button"
          onClick={onAdd}
          className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50"
        >
          <PlusIcon />
          Agregar horario
        </button>
      </div>

      {slots.length > 0 && (
        <div className="mt-3 space-y-2.5">
          {slots.map((slot) => (
            <div key={slot.id} className="grid grid-cols-1 gap-2 rounded-lg bg-slate-50 p-2.5 sm:grid-cols-[1fr_90px_90px_auto]">
              <input
                value={slot.titulo}
                onChange={(e) => onUpdate(slot.id, { titulo: e.target.value })}
                placeholder="Título (ej. Culto General)"
                className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900 shadow-sm transition focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/10"
              />
              <input
                value={slot.horaInicio}
                onChange={(e) => onUpdate(slot.id, { horaInicio: e.target.value })}
                placeholder="10:00 a.m."
                className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900 shadow-sm transition focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/10"
              />
              <input
                value={slot.horaFin}
                onChange={(e) => onUpdate(slot.id, { horaFin: e.target.value })}
                placeholder="11:00 a.m."
                className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900 shadow-sm transition focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/10"
              />
              <button
                type="button"
                onClick={() => onRemove(slot.id)}
                className="flex items-center justify-center rounded-lg px-2 py-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                title="Eliminar horario"
              >
                <TrashMiniIcon />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
