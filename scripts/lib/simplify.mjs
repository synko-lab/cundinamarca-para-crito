// Simplificación de polígonos GeoJSON (Douglas-Peucker). Compartido por los
// scripts de descarga y por simplify-boundaries.mjs.

function perpendicularDistance(point, lineStart, lineEnd) {
  const [x, y] = point;
  const [x1, y1] = lineStart;
  const [x2, y2] = lineEnd;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(x - x1, y - y1);
  const t = ((x - x1) * dx + (y - y1) * dy) / lenSq;
  const projX = x1 + t * dx;
  const projY = y1 + t * dy;
  return Math.hypot(x - projX, y - projY);
}

function douglasPeucker(points, epsilon) {
  if (points.length <= 2) return points;
  let maxDist = 0;
  let index = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const d = perpendicularDistance(points[i], points[0], points[points.length - 1]);
    if (d > maxDist) {
      maxDist = d;
      index = i;
    }
  }
  if (maxDist > epsilon) {
    const left = douglasPeucker(points.slice(0, index + 1), epsilon);
    const right = douglasPeucker(points.slice(index), epsilon);
    return [...left.slice(0, -1), ...right];
  }
  return [points[0], points[points.length - 1]];
}

function simplifyRing(ring, epsilon) {
  const simplified = douglasPeucker(ring, epsilon);
  // Un anillo válido necesita al menos 4 puntos (cerrado); si quedó muy
  // corto, se conserva el original para no romper la geometría.
  return simplified.length >= 4 ? simplified : ring;
}

export function simplifyGeometry(geometry, epsilon) {
  if (geometry.type === "Polygon") {
    return { ...geometry, coordinates: geometry.coordinates.map((ring) => simplifyRing(ring, epsilon)) };
  }
  if (geometry.type === "MultiPolygon") {
    return {
      ...geometry,
      coordinates: geometry.coordinates.map((poly) => poly.map((ring) => simplifyRing(ring, epsilon))),
    };
  }
  return geometry;
}

export function countPoints(geometry) {
  if (geometry.type === "Polygon") return geometry.coordinates.reduce((n, r) => n + r.length, 0);
  if (geometry.type === "MultiPolygon")
    return geometry.coordinates.reduce((n, poly) => n + poly.reduce((m, r) => m + r.length, 0), 0);
  return 0;
}

// Epsilon en grados (~1° ≈ 111 km).
export const EPSILON_MUNICIPIO = 0.0006; // ≈ 65 m, imperceptible entre zoom 8-15
export const EPSILON_CUNDINAMARCA = 0.0015; // el contorno solo se usa como máscara de fondo
