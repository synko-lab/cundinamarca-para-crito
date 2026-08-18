"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useRef, useState } from "react";

export type IglesiaListItem = {
  id: string;
  nombre: string;
  pastor: string | null;
  municipio: string;
  logoUrl: string | null;
  createdAt: number | null;
};

const PAGE_SIZE = 12;
const MAX_SUGGESTIONS = 6;

function SearchIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m20 20-4.3-4.3" />
    </svg>
  );
}

function MapPinIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Z" />
      <circle cx="12" cy="9.5" r="2.3" />
    </svg>
  );
}

function initials(nombre: string) {
  return (
    nombre
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join("") || "?"
  );
}

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export default function IglesiasDirectory({ items }: { items: IglesiaListItem[] }) {
  const [query, setQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [municipio, setMunicipio] = useState<string>("");
  const [page, setPage] = useState(1);
  const searchBoxRef = useRef<HTMLDivElement>(null);

  const municipios = useMemo(() => {
    const set = new Set(items.map((i) => i.municipio).filter(Boolean));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [items]);

  const normalizedQuery = normalize(query.trim());

  const suggestions = useMemo(() => {
    if (!normalizedQuery) return [];
    return items
      .filter(
        (i) =>
          normalize(i.nombre).includes(normalizedQuery) ||
          normalize(i.municipio).includes(normalizedQuery) ||
          (i.pastor && normalize(i.pastor).includes(normalizedQuery))
      )
      .slice(0, MAX_SUGGESTIONS);
  }, [items, normalizedQuery]);

  const filtered = useMemo(() => {
    return items.filter((i) => {
      if (municipio && i.municipio !== municipio) return false;
      if (!normalizedQuery) return true;
      return (
        normalize(i.nombre).includes(normalizedQuery) ||
        normalize(i.municipio).includes(normalizedQuery) ||
        (i.pastor && normalize(i.pastor).includes(normalizedQuery))
      );
    });
  }, [items, municipio, normalizedQuery]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [query, municipio]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 px-4 py-10 sm:py-16">
      <div className="mx-auto w-full max-w-5xl">
        <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Directorio de Iglesias</h1>
            <p className="mt-1 text-sm text-slate-500">
              {items.length} {items.length === 1 ? "iglesia registrada" : "iglesias registradas"} en Cundinamarca.
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            Ver mapa
          </Link>
        </div>

        <div className="mb-6 flex flex-col gap-3 sm:flex-row">
          <div ref={searchBoxRef} className="relative flex-1">
            <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              placeholder="Buscar por nombre, pastor o municipio…"
              className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 shadow-sm transition focus:border-emerald-600 focus:outline-none focus:ring-4 focus:ring-emerald-600/10"
            />

            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-10 mt-1.5 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
                {suggestions.map((s) => (
                  <Link
                    key={s.id}
                    href={`/iglesias/${s.id}`}
                    className="flex items-center gap-3 px-3.5 py-2.5 text-sm transition hover:bg-emerald-50"
                    onClick={() => setShowSuggestions(false)}
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md bg-emerald-50 text-xs font-bold text-emerald-700">
                      {s.logoUrl ? <img src={s.logoUrl} alt="" className="h-full w-full object-cover" /> : initials(s.nombre)}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate font-medium text-slate-900">{s.nombre}</div>
                      <div className="truncate text-xs text-slate-400">{s.municipio}</div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <select
            value={municipio}
            onChange={(e) => setMunicipio(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-emerald-600 focus:outline-none focus:ring-4 focus:ring-emerald-600/10 sm:w-56"
          >
            <option value="">Todos los municipios</option>
            {municipios.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 py-16 text-center">
            <p className="text-sm font-medium text-slate-600">
              {items.length === 0 ? "Todavía no hay iglesias registradas." : "No se encontraron iglesias con esos filtros."}
            </p>
            {items.length === 0 ? (
              <>
                <p className="mt-1 text-sm text-slate-400">Vuelve pronto — estamos completando el directorio.</p>
              </>
            ) : (
              <button
                onClick={() => {
                  setQuery("");
                  setMunicipio("");
                }}
                className="mt-4 text-sm font-medium text-emerald-700 hover:underline"
              >
                Quitar filtros
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {pageItems.map((it) => (
                <Link
                  key={it.id}
                  href={`/iglesias/${it.id}`}
                  className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
                >
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-emerald-50 text-lg font-bold text-emerald-700">
                    {it.logoUrl ? <img src={it.logoUrl} alt={it.nombre} className="h-full w-full object-cover" /> : initials(it.nombre)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-semibold text-slate-900 group-hover:text-emerald-700">{it.nombre}</h3>
                    {it.pastor && <p className="truncate text-sm text-slate-500">Pastor: {it.pastor}</p>}
                    <div className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                      <MapPinIcon />
                      {it.municipio}
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-1.5">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Anterior
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={[
                      "h-9 w-9 rounded-lg text-sm font-medium transition",
                      p === currentPage ? "bg-emerald-700 text-white" : "text-slate-600 hover:bg-slate-100",
                    ].join(" ")}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Siguiente
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
