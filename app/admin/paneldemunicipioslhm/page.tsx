"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AdminNav from "../components/AdminNav";

type MunicipioRow = {
  id: string;
  nombre: string;
  habitantes: number | null;
  distanciaBosaCentroKm: number | null;
  distanciaBosaCentroMinutos: number | null;
  lat: number | null;
  lng: number | null;
  banderaUrl: string | null;
};

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

export default function PanelMunicipiosPage() {
  const [items, setItems] = useState<MunicipioRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function load() {
    setLoading(true);
    fetch("/api/municipios")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setItems(data.items || []);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) => it.nombre?.toLowerCase().includes(q));
  }, [items, query]);

  async function handleDelete(id: string, nombre: string) {
    if (!confirm(`¿Eliminar "${nombre}"? Esta acción no se puede deshacer.`)) return;
    setDeletingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/municipios/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "No se pudo eliminar.");
      setItems((prev) => prev.filter((it) => it.id !== id));
    } catch (err: any) {
      setError(err?.message || String(err));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div
      className="min-h-screen bg-white px-4 py-10 sm:py-16"
      style={{ backgroundImage: "radial-gradient(#e2e8f0 1px, transparent 1px)", backgroundSize: "22px 22px" }}
    >
      <div className="mx-auto w-full max-w-4xl">
        <AdminNav />

        <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Panel de Municipios</h1>
            <p className="mt-1 text-sm text-slate-500">
              {items.length} {items.length === 1 ? "municipio registrado" : "municipios registrados"}.
            </p>
          </div>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre…"
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-[#003893] focus:outline-none focus:ring-4 focus:ring-[#003893]/10 sm:w-72"
          />
        </div>

        {error && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {loading ? (
            <div className="px-6 py-16 text-center text-sm text-slate-400">Cargando…</div>
          ) : filtered.length === 0 ? (
            <div className="px-6 py-16 text-center text-sm text-slate-400">
              {items.length === 0 ? "Todavía no hay municipios registrados." : "Sin resultados para esa búsqueda."}
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {filtered.map((it) => (
                <li key={it.id} className="flex items-center gap-4 px-5 py-3.5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-blue-50 text-sm font-bold text-[#003893]">
                    {it.banderaUrl ? <img src={it.banderaUrl} alt="" className="h-full w-full object-cover" /> : initials(it.nombre)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium text-slate-900">{it.nombre}</div>
                    <div className="truncate text-xs text-slate-500">
                      {it.habitantes ? `${it.habitantes.toLocaleString("es-CO")} habitantes` : "Habitantes: dato pendiente"}
                      {" · "}
                      {it.lat != null && it.lng != null ? "En el mapa" : "Sin coordenadas"}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Link
                      href={`/municipios/${it.id}`}
                      target="_blank"
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                    >
                      Ver
                    </Link>
                    <Link
                      href={`/admin/editarmunicipiolhmission?id=${it.id}`}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                    >
                      Editar
                    </Link>
                    <button
                      onClick={() => handleDelete(it.id, it.nombre)}
                      disabled={deletingId === it.id}
                      className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {deletingId === it.id ? "Eliminando…" : "Eliminar"}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
