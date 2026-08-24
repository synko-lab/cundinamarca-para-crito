export type Municipio = {
  nombre: string;
  habitantes: number | null; // null = dato pendiente
  latitud: number | null; // null = dato pendiente
  longitud: number | null; // null = dato pendiente
};

// Lista inicial de municipios de Cundinamarca preparada para ser completada
// NOTA: No incluir datos inventados. De momento los valores numéricos quedan en null.
export const MUNICIPIOS: Municipio[] = [
  { nombre: "Fusagasuga", habitantes: null, latitud: null, longitud: null },
  { nombre: "Soacha", habitantes: null, latitud: null, longitud: null },
  { nombre: "Girardot", habitantes: null, latitud: null, longitud: null },
  { nombre: "Zipaquirá", habitantes: null, latitud: null, longitud: null },
  { nombre: "Facatativá", habitantes: null, latitud: null, longitud: null },
  { nombre: "Chía", habitantes: null, latitud: null, longitud: null },
  { nombre: "Duitama", habitantes: null, latitud: null, longitud: null },
  { nombre: "Madrid", habitantes: null, latitud: null, longitud: null },
  { nombre: "Nemocón", habitantes: null, latitud: null, longitud: null },
  { nombre: "Villeta", habitantes: null, latitud: null, longitud: null },
  { nombre: "Funza", habitantes: null, latitud: null, longitud: null },
  { nombre: "Tenjo", habitantes: null, latitud: null, longitud: null },
  { nombre: "Cajicá", habitantes: null, latitud: null, longitud: null },
  { nombre: "Guaduas", habitantes: null, latitud: null, longitud: null },
  { nombre: "Dato pendiente (otro)", habitantes: null, latitud: null, longitud: null },
];

export const BOSA_CENTRO = {
  // Preparado para rellenar lat/lng de Bosa Centro si se dispone de coordenadas confiables.
  lat: null as number | null,
  lng: null as number | null,
};

export function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
