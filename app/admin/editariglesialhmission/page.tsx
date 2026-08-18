"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import AdminNav from "../components/AdminNav";
import IglesiaForm from "../components/IglesiaForm";

function EditarIglesiaContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 py-10 px-4 sm:py-16">
      <div className="mx-auto w-full max-w-2xl">
        <AdminNav />
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Editar Iglesia</h1>
          <p className="mt-2 text-sm text-slate-500 sm:text-base">
            Panel interno de administración del directorio de iglesias de Cundinamarca.
          </p>
        </div>

        {id ? (
          <IglesiaForm editId={id} />
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 px-6 py-16 text-center">
            <p className="text-sm font-medium text-slate-600">No se especificó ninguna iglesia para editar.</p>
            <Link href="/admin/paneldeiglesiaslhm" className="mt-3 inline-block text-sm font-medium text-emerald-700 hover:underline">
              Ir al panel de iglesias
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function EditarIglesiaPage() {
  return (
    <Suspense fallback={null}>
      <EditarIglesiaContent />
    </Suspense>
  );
}
