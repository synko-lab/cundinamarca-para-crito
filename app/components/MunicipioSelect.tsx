"use client";

export type MunicipioOption = { id: string; nombre: string };

export default function MunicipioSelect({
  municipios,
  value,
  onSelect,
  className = "",
}: {
  municipios: MunicipioOption[];
  value: string | null;
  onSelect: (id: string | null) => void;
  className?: string;
}) {
  return (
    <select
      value={value ?? ""}
      onChange={(e) => onSelect(e.target.value || null)}
      className={`w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-[#003893] focus:outline-none focus:ring-4 focus:ring-[#003893]/10 ${className}`}
    >
      <option value="">Selecciona un municipio…</option>
      {municipios.map((m) => (
        <option key={m.id} value={m.id}>
          {m.nombre}
        </option>
      ))}
    </select>
  );
}
