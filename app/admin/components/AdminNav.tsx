"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminNav() {
  const pathname = usePathname();
  const isMunicipioContext = pathname.includes("municipio");
  const isIglesiaContext = !isMunicipioContext;

  const crearHref = isMunicipioContext ? "/admin/registromunicipiolhmission" : "/admin/registroiglesialhmission";

  function tabClass(active: boolean) {
    return [
      "rounded-lg px-3 py-1.5 text-xs font-semibold transition",
      active ? "bg-slate-900 text-white" : "border border-slate-200 text-slate-600 hover:bg-slate-50",
    ].join(" ");
  }

  return (
    <div className="mb-6 flex flex-wrap items-center justify-center gap-2">
      <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
        Admin
      </span>
      <nav className="flex flex-wrap items-center gap-1.5">
        <Link href="/admin/paneldeiglesiaslhm" className={tabClass(isIglesiaContext)}>
          Iglesias
        </Link>
        <Link href="/admin/paneldemunicipioslhm" className={tabClass(isMunicipioContext)}>
          Municipios
        </Link>
        <Link
          href={crearHref}
          className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-800"
        >
          + Crear
        </Link>
      </nav>
    </div>
  );
}
