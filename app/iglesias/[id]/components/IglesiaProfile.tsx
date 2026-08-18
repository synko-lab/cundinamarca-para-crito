"use client";

import React, { useEffect, useMemo, useState } from "react";
import IglesiaHero, { type Imagen } from "./IglesiaHero";
import GaleriaSection from "./GaleriaSection";
import { DIAS_SEMANA, type HorariosSemana } from "../../../../src/lib/horarios";
import {
  PhoneIcon,
  MailIcon,
  MapPinIcon,
  HomeIcon,
  ClockIcon,
  UsersIcon,
  RulerIcon,
  CalendarIcon,
} from "./icons";

export type IglesiaData = {
  nombre: string;
  pastor: string;
  telefono: string;
  email: string;
  municipio: string;
  direccion: string;
  barrio: string;
  horarios: HorariosSemana;
  descripcion: string;
  habitantesMunicipio: number | null;
  distanciaBosaCentroKm: number | null;
  createdAt: number | null;
  updatedAt: number | null;
};

function fmtDate(ms: number | null) {
  if (!ms) return "-";
  return new Date(ms).toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" });
}

function latestByTipo(images: Imagen[], tipo: string): Imagen | null {
  const matches = images.filter((i) => i.tipo === tipo);
  if (matches.length === 0) return null;
  return matches.reduce((a, b) => ((a.createdAt ?? 0) >= (b.createdAt ?? 0) ? a : b));
}

export default function IglesiaProfile({ id, initialData }: { id: string; initialData: IglesiaData }) {
  const [images, setImages] = useState<Imagen[]>([]);

  useEffect(() => {
    fetch(`/api/iglesias/${id}/imagenes`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setImages(data.items || []);
      })
      .catch((err) => console.error(err));
  }, [id]);

  const logo = useMemo(() => latestByTipo(images, "logo"), [images]);
  const portada = useMemo(() => latestByTipo(images, "portada"), [images]);
  const galeria = useMemo(
    () => images.filter((i) => i.tipo === "galeria").sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0)),
    [images]
  );

  const infoRows: [React.ComponentType<{ className?: string }>, string, React.ReactNode][] = [
    [PhoneIcon, "Teléfono", initialData.telefono || "-"],
    [MailIcon, "Correo", initialData.email || "-"],
    [MapPinIcon, "Municipio", initialData.municipio || "-"],
    [HomeIcon, "Dirección", initialData.direccion || "-"],
    [HomeIcon, "Barrio", initialData.barrio || "-"],
    [UsersIcon, "Habitantes municipio", initialData.habitantesMunicipio ?? "Dato pendiente"],
    [RulerIcon, "Distancia a Bosa Centro (km)", initialData.distanciaBosaCentroKm ?? "Dato pendiente"],
  ];

  const diasConHorario = DIAS_SEMANA.filter((d) => (initialData.horarios[d] || []).length > 0);

  return (
    <div className="space-y-6">
      <IglesiaHero
        iglesiaId={id}
        nombre={initialData.nombre}
        pastor={initialData.pastor}
        municipio={initialData.municipio}
        logo={logo}
        portada={portada}
        readOnly
      />

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <dl className="divide-y divide-slate-100 rounded-lg border border-slate-200">
          {infoRows.map(([Icon, label, value]) => (
            <div key={label} className="flex items-center justify-between gap-4 px-4 py-2.5 text-sm">
              <dt className="flex items-center gap-2 text-slate-500">
                <Icon className="h-4 w-4 text-emerald-700" />
                {label}
              </dt>
              <dd className="text-right font-medium text-slate-900">{value}</dd>
            </div>
          ))}
        </dl>

        {initialData.descripcion && (
          <div className="mt-4">
            <h2 className="text-sm font-medium text-slate-700">Descripción</h2>
            <p className="mt-1 text-sm text-slate-600">{initialData.descripcion}</p>
          </div>
        )}

        <p className="mt-4 flex items-center gap-1.5 text-xs text-slate-400">
          <CalendarIcon className="h-3.5 w-3.5" />
          Creado: {fmtDate(initialData.createdAt)} • Actualizado: {fmtDate(initialData.updatedAt)}
        </p>
      </div>

      {diasConHorario.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-4 flex items-center gap-2">
            <ClockIcon className="h-5 w-5 text-emerald-700" />
            <h2 className="text-lg font-semibold text-slate-900">Horarios de Culto</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {diasConHorario.map((dia) => (
              <div key={dia} className="grid grid-cols-1 gap-2 py-3 first:pt-0 last:pb-0 sm:grid-cols-[120px_1fr] sm:gap-4">
                <div className="text-sm font-semibold text-slate-900">{dia}</div>
                <div className="space-y-2">
                  {(initialData.horarios[dia] || []).map((slot) => (
                    <div key={slot.id} className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1 rounded-lg bg-slate-50 px-3 py-2">
                      {slot.hora && (
                        <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                          {slot.hora}
                        </span>
                      )}
                      {slot.titulo && <span className="text-sm font-medium text-slate-900">{slot.titulo}</span>}
                      {slot.descripcion && <span className="text-xs text-slate-500">{slot.descripcion}</span>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <GaleriaSection iglesiaId={id} images={galeria} readOnly />
    </div>
  );
}
