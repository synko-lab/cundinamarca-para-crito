export const DIAS_SEMANA = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"] as const;

export type DiaSemana = (typeof DIAS_SEMANA)[number];

export type HorarioSlot = {
  id: string;
  titulo: string;
  horaInicio: string;
  horaFin: string;
};

export type HorariosSemana = Record<string, HorarioSlot[]>;

export function emptyHorarios(): HorariosSemana {
  return Object.fromEntries(DIAS_SEMANA.map((d) => [d, []]));
}

/** Normaliza cualquier valor venido de Firestore/API a una estructura completa de 7 días. */
export function normalizeHorarios(raw: unknown): HorariosSemana {
  const base = emptyHorarios();
  if (raw && typeof raw === "object") {
    for (const dia of DIAS_SEMANA) {
      const slots = (raw as any)[dia];
      if (Array.isArray(slots)) {
        base[dia] = slots
          .filter((s) => s && typeof s === "object")
          .map((s: any, i: number) => ({
            id: String(s.id ?? `${dia}-${i}`),
            titulo: String(s.titulo ?? ""),
            horaInicio: String(s.horaInicio ?? s.hora ?? ""),
            horaFin: String(s.horaFin ?? ""),
          }));
      }
    }
  }
  return base;
}

/** Limpia la estructura para guardar: quita slots vacíos y días sin horarios. */
export function cleanHorariosForSave(horarios: HorariosSemana): Record<string, { titulo: string; horaInicio: string; horaFin: string }[]> {
  const result: Record<string, { titulo: string; horaInicio: string; horaFin: string }[]> = {};
  for (const dia of DIAS_SEMANA) {
    const slots = (horarios[dia] || [])
      .filter((s) => s.titulo.trim() || s.horaInicio.trim() || s.horaFin.trim())
      .map((s) => ({ titulo: s.titulo.trim(), horaInicio: s.horaInicio.trim(), horaFin: s.horaFin.trim() }));
    if (slots.length > 0) result[dia] = slots;
  }
  return result;
}

export function newSlotId(): string {
  return `slot-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
