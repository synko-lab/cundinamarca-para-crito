"use client";

import React, { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export type MunicipioPin = {
  id: string;
  nombre: string;
  lat: number;
  lng: number;
  habitantes: number | null;
  banderaUrl: string | null;
};

export type IglesiaPin = {
  id: string;
  nombre: string;
  municipio: string;
  lat: number;
  lng: number;
  pastor: string | null;
  logoUrl: string | null;
};

const CUNDINAMARCA_CENTER: [number, number] = [4.85, -74.2];
const MIN_ZOOM = 8;
const MAX_ZOOM = 15;
const FOCUS_ZOOM = 12;
// Las iglesias de un municipio solo se muestran cuando se cumplen las DOS
// condiciones a la vez: hay un municipio activo Y el zoom llegó a este
// nivel. Si falta cualquiera de las dos, se ven los clusters de municipio.
const IGLESIA_ZOOM_THRESHOLD = 12;
// Con el mapa muy alejado (~70 municipios a la vez) las etiquetas permanentes
// se amontonan y se vuelven ilegibles. Se ocultan hasta este nivel de zoom.
const TOOLTIP_MIN_ZOOM = 11;

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

// Pin de municipio ("cluster"): un ícono simple (iglesia o carita triste
// según tenga o no iglesias registradas) con una burbuja de conteo si hay
// más de una.
function municipioIcon(iglesiaCount: number) {
  const emoji = iglesiaCount > 0 ? "⛪" : "😢";
  const borderColor = iglesiaCount > 0 ? "#047857" : "#94a3b8";
  const bubble =
    iglesiaCount > 1
      ? `<div style="position:absolute;bottom:-4px;right:-6px;min-width:16px;height:16px;padding:0 3px;border-radius:9999px;background:#CE1126;color:#fff;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;line-height:1;box-shadow:0 1px 3px rgba(0,0,0,0.4);">${iglesiaCount}</div>`
      : "";

  return L.divIcon({
    className: "",
    html: `
      <div style="position:relative;width:34px;height:34px;">
        <div style="width:34px;height:34px;border-radius:50%;background:#fff;border:2px solid ${borderColor};display:flex;align-items:center;justify-content:center;font-size:17px;box-shadow:0 2px 6px rgba(0,0,0,0.3);">${emoji}</div>
        ${bubble}
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -20],
  });
}

function iglesiaPinIcon(i: Pick<IglesiaPin, "nombre" | "logoUrl">) {
  const badge = i.logoUrl
    ? `<img src="${i.logoUrl}" style="width:100%;height:100%;object-fit:cover;" />`
    : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#ecfdf5;color:#047857;font-weight:700;font-size:11px;">${initials(
        i.nombre
      )}</div>`;

  return L.divIcon({
    className: "",
    html: `
      <div style="position:relative;width:32px;height:41px;">
        <div style="position:absolute;top:0;left:0;width:32px;height:32px;border-radius:50%;border:3px solid #047857;overflow:hidden;background:#fff;box-shadow:0 2px 6px rgba(0,0,0,0.35);">
          ${badge}
        </div>
        <div style="position:absolute;bottom:0;left:50%;transform:translateX(-50%);width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:10px solid #047857;"></div>
      </div>
    `,
    iconSize: [32, 41],
    iconAnchor: [16, 41],
    popupAnchor: [0, -37],
  });
}

function bindPermanentTooltip(marker: L.Marker, content: string) {
  marker.bindTooltip(content, {
    permanent: true,
    direction: "top",
    offset: [0, -28],
    opacity: 1,
  });
}

function applyTooltipVisibility(markers: L.Marker[], zoom: number) {
  markers.forEach((marker) => {
    if (zoom >= TOOLTIP_MIN_ZOOM) marker.openTooltip();
    else marker.closeTooltip();
  });
}

function iglesiaTooltipHtml(ig: Pick<IglesiaPin, "nombre" | "pastor">) {
  const pastorTxt = ig.pastor ? `Pastor: ${ig.pastor}` : "";
  return `<div style="font-family:inherit;line-height:1.25;">
      <div style="font-weight:700;font-size:12px;color:#0f172a;">${ig.nombre}</div>
      ${pastorTxt ? `<div style="font-size:10px;color:#64748b;">${pastorTxt}</div>` : ""}
    </div>`;
}

// Las iglesias de un municipio solo se ven si HAY municipio activo Y el
// zoom alcanzó el umbral (ambas condiciones a la vez). Mostrar los
// clusters de municipio es exactamente la condición contraria.
function shouldShowIglesias(focusedId: string | null, zoom: number) {
  return Boolean(focusedId) && zoom >= IGLESIA_ZOOM_THRESHOLD;
}

export default function CundinamarcaMap({
  municipios,
  iglesias = [],
  focusedMunicipioId = null,
  onFocusMunicipio,
}: {
  municipios: MunicipioPin[];
  iglesias?: IglesiaPin[];
  focusedMunicipioId?: string | null;
  onFocusMunicipio?: (id: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const municipiosLayerRef = useRef<L.LayerGroup | null>(null);
  const iglesiasFocusLayerRef = useRef<L.LayerGroup | null>(null);
  const municipioMarkersRef = useRef<L.Marker[]>([]);
  const iglesiaFocusMarkersRef = useRef<L.Marker[]>([]);
  const focusedIdRef = useRef<string | null>(null);
  const syncVisibilityRef = useRef<() => void>(() => {});
  const router = useRouter();
  const onFocusMunicipioRef = useRef(onFocusMunicipio);
  onFocusMunicipioRef.current = onFocusMunicipio;

  // Monta el mapa y la capa de municipios (clusters) una sola vez.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: CUNDINAMARCA_CENTER,
      zoom: 9,
      minZoom: MIN_ZOOM,
      maxZoom: MAX_ZOOM,
      scrollWheelZoom: false,
      zoomControl: false,
    });
    mapRef.current = map;

    L.control.zoom({ position: "bottomright" }).addTo(map);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      minZoom: MIN_ZOOM,
      maxZoom: MAX_ZOOM,
    }).addTo(map);

    const municipiosLayer = L.layerGroup().addTo(map);
    municipiosLayerRef.current = municipiosLayer;
    const iglesiasFocusLayer = L.layerGroup();
    iglesiasFocusLayerRef.current = iglesiasFocusLayer;

    const conteoPorMunicipio = new Map<string, number>();
    iglesias.forEach((ig) => {
      conteoPorMunicipio.set(ig.municipio, (conteoPorMunicipio.get(ig.municipio) ?? 0) + 1);
    });

    municipios.forEach((m) => {
      const iglesiaCount = conteoPorMunicipio.get(m.nombre) ?? 0;
      const marker = L.marker([m.lat, m.lng], { icon: municipioIcon(iglesiaCount) }).addTo(municipiosLayer);
      const habitantesTxt = m.habitantes ? `${m.habitantes.toLocaleString("es-CO")} hab.` : "Dato pendiente";
      bindPermanentTooltip(
        marker,
        `<div style="font-family:inherit;line-height:1.25;">
           <div style="font-weight:700;font-size:12px;color:#0f172a;">${m.nombre}</div>
           <div style="font-size:10px;color:#64748b;">${habitantesTxt}</div>
         </div>`
      );
      // Clic en el "cluster" del municipio: lo enfoca (igual que elegirlo
      // desde el selector) y acerca el mapa hacia él.
      marker.on("click", () => onFocusMunicipioRef.current?.(m.id));
      municipioMarkersRef.current.push(marker);
    });

    function syncVisibility() {
      const zoom = map.getZoom();
      const showIglesias = shouldShowIglesias(focusedIdRef.current, zoom);

      // Leaflet reabre automáticamente los tooltips "permanent" apenas su
      // capa se añade al mapa, así que las capas deben resolverse ANTES de
      // aplicar la visibilidad de tooltips.
      if (showIglesias) {
        if (!map.hasLayer(iglesiasFocusLayer)) map.addLayer(iglesiasFocusLayer);
        if (map.hasLayer(municipiosLayer)) map.removeLayer(municipiosLayer);
      } else {
        if (map.hasLayer(iglesiasFocusLayer)) map.removeLayer(iglesiasFocusLayer);
        if (!map.hasLayer(municipiosLayer)) map.addLayer(municipiosLayer);
      }

      applyTooltipVisibility(municipioMarkersRef.current, zoom);
      applyTooltipVisibility(iglesiaFocusMarkersRef.current, zoom);
    }

    syncVisibilityRef.current = syncVisibility;
    syncVisibility();
    map.on("zoomend", syncVisibility);

    return () => {
      map.remove();
      mapRef.current = null;
      municipiosLayerRef.current = null;
      iglesiasFocusLayerRef.current = null;
      municipioMarkersRef.current = [];
      iglesiaFocusMarkersRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reacciona al municipio enfocado desde el selector (o el clic en un
  // cluster): reconstruye los pines de sus iglesias, acerca/aleja el mapa,
  // y reevalúa de inmediato qué capa corresponde mostrar.
  useEffect(() => {
    const map = mapRef.current;
    const iglesiasFocusLayer = iglesiasFocusLayerRef.current;
    if (!map || !iglesiasFocusLayer) return;

    const previousId = focusedIdRef.current;
    focusedIdRef.current = focusedMunicipioId;

    iglesiasFocusLayer.clearLayers();
    iglesiaFocusMarkersRef.current = [];

    if (!focusedMunicipioId) {
      if (previousId) map.flyTo(CUNDINAMARCA_CENTER, 9);
      syncVisibilityRef.current();
      return;
    }

    const municipio = municipios.find((m) => m.id === focusedMunicipioId);
    if (!municipio) return;

    const iglesiasDelMunicipio = iglesias.filter((i) => i.municipio === municipio.nombre);
    iglesiasDelMunicipio.forEach((ig) => {
      const marker = L.marker([ig.lat, ig.lng], { icon: iglesiaPinIcon(ig) }).addTo(iglesiasFocusLayer);
      bindPermanentTooltip(marker, iglesiaTooltipHtml(ig));
      marker.on("click", () => router.push(`/iglesias/${ig.id}`));
      iglesiaFocusMarkersRef.current.push(marker);
    });

    map.flyTo([municipio.lat, municipio.lng], FOCUS_ZOOM);
    (map as any)._syncVisibility?.();
  }, [focusedMunicipioId, municipios, iglesias, router]);

  return <div ref={containerRef} className="h-full w-full" />;
}
