"use client";

import { useRouter } from "next/navigation";

export type MunicipioOption = { id: string; nombre: string };

export default function MunicipioSelect({
  municipios,
  className = "",
}: {
  municipios: MunicipioOption[];
  className?: string;
}) {
  const router = useRouter();

  return (
    <select
      defaultValue=""
      onChange={(e) => {
        if (e.target.value) router.push(`/municipios/${e.target.value}`);
      }}
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
