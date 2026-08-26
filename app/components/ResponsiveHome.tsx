"use client";

import { useEffect, useState } from "react";
import MobileHome from "./MobileHome";
import DesktopHome from "./DesktopHome";
import type { MunicipioPin, IglesiaPin } from "./CundinamarcaMap";
import type { MunicipioOption } from "./MunicipioSelect";

// Antes MobileHome y DesktopHome se montaban los dos siempre (uno oculto
// con CSS), así que cada visita levantaba DOS instancias de Leaflet y
// duplicaba las descargas de tiles y de los GeoJSON de contornos (~330 KB
// extra) sin importar el dispositivo. Aquí se monta solo el layout que
// corresponde al viewport actual.
const DESKTOP_QUERY = "(min-width: 640px)";

export default function ResponsiveHome(props: {
  totalMunicipios: number;
  totalIglesias: number;
  totalHabitantes: string;
  municipios: MunicipioPin[];
  iglesias: IglesiaPin[];
  municipiosOptions: MunicipioOption[];
}) {
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null);

  useEffect(() => {
    const mql = window.matchMedia(DESKTOP_QUERY);
    setIsDesktop(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  // Aún no sabemos el viewport (primer paint antes de que corra el efecto):
  // no renderizamos ningún layout para no montar (ni de paso descartar) un
  // mapa de más.
  if (isDesktop === null) return null;

  return isDesktop ? (
    <div className="hidden min-h-screen w-full items-center justify-center sm:flex">
      <div className="w-11/12 max-w-7xl">
        <DesktopHome {...props} />
      </div>
    </div>
  ) : (
    <MobileHome {...props} />
  );
}
