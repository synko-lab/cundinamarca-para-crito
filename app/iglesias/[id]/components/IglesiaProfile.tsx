"use client";

import React, { useEffect, useMemo, useState } from "react";
import IglesiaHero, { type Imagen } from "./IglesiaHero";
import GaleriaSection from "./GaleriaSection";
import HorariosCultoCard from "./HorariosCultoCard";
import { type HorariosSemana } from "../../../../src/lib/horarios";
import {
  PhoneIcon,
  MailIcon,
  MapPinIcon,
  HomeIcon,
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
  ];

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

      <HorariosCultoCard horarios={initialData.horarios} />

      <GaleriaSection iglesiaId={id} images={galeria} readOnly />
    </div>
  );
}
