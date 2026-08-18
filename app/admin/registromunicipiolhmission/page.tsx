"use client";

import AdminNav from "../components/AdminNav";
import MunicipioForm from "../components/MunicipioForm";

export default function AdminRegistroMunicipioPage() {
  return (
    <div
      className="min-h-screen bg-white px-4 py-10 sm:py-16"
      style={{ backgroundImage: "radial-gradient(#e2e8f0 1px, transparent 1px)", backgroundSize: "22px 22px" }}
    >
      <div className="mx-auto w-full max-w-xl">
        <AdminNav />
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 mt-4 h-2 w-16 overflow-hidden rounded-full">
            <div className="h-1/2 bg-[#FCD116]" />
            <div className="flex h-1/2">
              <div className="w-1/2 bg-[#003893]" />
              <div className="w-1/2 bg-[#CE1126]" />
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Registrar Municipio</h1>
          <p className="mt-2 text-sm text-slate-500">Panel interno de administración del mapa de Cundinamarca.</p>
        </div>

        <MunicipioForm />
      </div>
    </div>
  );
}
