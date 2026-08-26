// Descarga el contorno del departamento de Cundinamarca (nivel
// administrativo, no un municipio) desde OpenStreetMap/Nominatim, para
// usarlo como máscara del mapa (oscurecer todo lo que quede afuera) y
// para limitar el paneo a esa zona.
//
// Uso: node scripts/fetch-cundinamarca-boundary.mjs

import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { simplifyGeometry, EPSILON_CUNDINAMARCA } from "./lib/simplify.mjs";

const OUT_PATH = path.join(process.cwd(), "public", "data", "cundinamarca-boundary.json");

async function main() {
  const url =
    "https://nominatim.openstreetmap.org/search?format=geojson&polygon_geojson=1&limit=1&countrycodes=co&q=" +
    encodeURIComponent("Cundinamarca, Colombia");
  const res = await fetch(url, { headers: { "User-Agent": "cundinamarca-para-cristo-app/1.0 (build script)" } });
  if (!res.ok) throw new Error(`Nominatim respondió ${res.status}`);
  const data = await res.json();
  const feature = data?.features?.find((f) => f.properties?.addresstype === "state") ?? data?.features?.[0];
  if (!feature?.geometry) throw new Error("No se encontró el contorno de Cundinamarca.");

  const simplified = simplifyGeometry(feature.geometry, EPSILON_CUNDINAMARCA);

  await mkdir(path.dirname(OUT_PATH), { recursive: true });
  await writeFile(OUT_PATH, JSON.stringify(simplified));
  console.log("Guardado:", OUT_PATH, "tipo:", simplified.type);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
