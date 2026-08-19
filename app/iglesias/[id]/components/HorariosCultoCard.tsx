"use client";

import React, { useState } from "react";
import { DIAS_SEMANA, type HorariosSemana } from "../../../../src/lib/horarios";
import { ClockIcon } from "./icons";

const DIA_ABREV: Record<string, string> = {
  Lunes: "Lun",
  Martes: "Mar",
  Miércoles: "Mié",
  Jueves: "Jue",
  Viernes: "Vie",
  Sábado: "Sáb",
  Domingo: "Dom",
};

export default function HorariosCultoCard({ horarios }: { horarios: HorariosSemana }) {
  const diasConHorario = DIAS_SEMANA.filter((d) => (horarios[d] || []).length > 0);
  const [selected, setSelected] = useState<string | null>(diasConHorario[0] ?? null);

  if (diasConHorario.length === 0) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="mb-4 flex items-center gap-2">
        <ClockIcon className="h-5 w-5 text-emerald-700" />
        <h2 className="text-lg font-semibold text-slate-900">Horarios</h2>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {DIAS_SEMANA.map((dia) => {
          const hasSlots = (horarios[dia] || []).length > 0;
          const active = selected === dia;
          return (
            <button
              key={dia}
              type="button"
              disabled={!hasSlots}
              onClick={() => setSelected(active ? null : dia)}
              className={[
                "flex min-w-[58px] shrink-0 flex-col items-center gap-1.5 rounded-xl border px-3 py-2.5 text-center transition",
                !hasSlots && "cursor-not-allowed border-slate-100 text-slate-300",
                hasSlots && active && "border-emerald-700 bg-emerald-700 text-white shadow-sm",
                hasSlots && !active && "border-slate-200 text-slate-700 hover:border-emerald-300 hover:bg-emerald-50",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <span className="text-[11px] font-semibold uppercase tracking-wide">{DIA_ABREV[dia]}</span>
              <span
                className={[
                  "h-1.5 w-1.5 rounded-full",
                  hasSlots ? (active ? "bg-white" : "bg-emerald-600") : "bg-transparent",
                ].join(" ")}
              />
            </button>
          );
        })}
      </div>

      {selected ? (
        <div className="mt-5">
          <div className="mb-2.5 text-sm font-semibold text-slate-900">{selected}</div>
          <div className="space-y-2">
            {(horarios[selected] || []).map((slot) => {
              const rango = [slot.horaInicio, slot.horaFin].filter(Boolean).join(" – ");
              return (
                <div
                  key={slot.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 px-3.5 py-2.5"
                >
                  <span className="text-sm font-medium text-slate-900">{slot.titulo || "Culto"}</span>
                  {rango && (
                    <span className="shrink-0 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                      {rango}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <p className="mt-5 text-sm text-slate-400">Selecciona un día para ver los horarios.</p>
      )}
    </div>
  );
}
