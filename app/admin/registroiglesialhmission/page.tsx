"use client";

import AdminNav from "../components/AdminNav";
import IglesiaForm from "../components/IglesiaForm";

export default function AdminRegistroIglesiaPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 py-10 px-4 sm:py-16">
      <div className="mx-auto w-full max-w-2xl">
        <AdminNav />
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Registrar Iglesia</h1>
          <p className="mt-2 text-sm text-slate-500 sm:text-base">
            Panel interno de administración del directorio de iglesias de Cundinamarca.
          </p>
        </div>

        <IglesiaForm />
      </div>
    </div>
  );
}
