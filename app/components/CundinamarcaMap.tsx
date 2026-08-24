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

function pinIcon(m: Pick<MunicipioPin, "nombre" | "banderaUrl">) {
  const badge = m.banderaUrl
    ? `<img src="${m.banderaUrl}" style="width:100%;height:100%;object-fit:cover;" />`
    : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#FCD116;color:#003893;font-weight:700;font-size:12px;">${initials(
        m.nombre
      )}</div>`;

  return L.divIcon({
    className: "",
    html: `
      <div style="position:relative;width:36px;height:46px;">
        <div style="position:absolute;top:0;left:0;width:36px;height:36px;border-radius:50%;border:3px solid #CE1126;overflow:hidden;background:#fff;box-shadow:0 2px 6px rgba(0,0,0,0.35);">
          ${badge}
        </div>
        <div style="position:absolute;bottom:0;left:50%;transform:translateX(-50%);width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;border-top:11px solid #CE1126;"></div>
      </div>
    `,
    iconSize: [36, 46],
    iconAnchor: [18, 46],
    popupAnchor: [0, -42],
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
    offset: [0, -38],
    opacity: 1,
  });
}

function applyTooltipVisibility(markers: L.Marker[], zoom: number) {
  markers.forEach((marker) => {
    if (zoom >= TOOLTIP_MIN_ZOOM) marker.openTooltip();
    else marker.closeTooltip();
  });
}

export default function CundinamarcaMap({
  municipios,
  iglesias = [],
  focusedMunicipioId = null,
}: {
  municipios: MunicipioPin[];
  iglesias?: IglesiaPin[];
  focusedMunicipioId?: string | null;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const municipiosLayerRef = useRef<L.LayerGroup | null>(null);
  const iglesiasLayerRef = useRef<L.LayerGroup | null>(null);
  const municipioMarkersRef = useRef<L.Marker[]>([]);
  const iglesiaMarkersRef = useRef<L.Marker[]>([]);
  const router = useRouter();

  // Monta el mapa y la capa de municipios una sola vez.
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
    iglesiasLayerRef.current = L.layerGroup();

    municipios.forEach((m) => {
      const marker = L.marker([m.lat, m.lng], { icon: pinIcon(m) }).addTo(municipiosLayer);
      const habitantesTxt = m.habitantes ? `${m.habitantes.toLocaleString("es-CO")} hab.` : "Dato pendiente";
      bindPermanentTooltip(
        marker,
        `<div style="font-family:inherit;line-height:1.25;">
           <div style="font-weight:700;font-size:12px;color:#0f172a;">${m.nombre}</div>
           <div style="font-size:10px;color:#64748b;">${habitantesTxt}</div>
         </div>`
      );
      marker.on("click", () => router.push(`/municipios/${m.id}`));
      municipioMarkersRef.current.push(marker);
    });

    applyTooltipVisibility(municipioMarkersRef.current, map.getZoom());
    map.on("zoomend", () => {
      const zoom = map.getZoom();
      applyTooltipVisibility(municipioMarkersRef.current, zoom);
      applyTooltipVisibility(iglesiaMarkersRef.current, zoom);
    });

    return () => {
      map.remove();
      mapRef.current = null;
      municipiosLayerRef.current = null;
      iglesiasLayerRef.current = null;
      municipioMarkersRef.current = [];
      iglesiaMarkersRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reacciona al municipio enfocado desde el selector: acerca el mapa, oculta
  // los pines de municipios y muestra los de las iglesias de ese municipio.
  useEffect(() => {
    const map = mapRef.current;
    const municipiosLayer = municipiosLayerRef.current;
    const iglesiasLayer = iglesiasLayerRef.current;
    if (!map || !municipiosLayer || !iglesiasLayer) return;

    iglesiasLayer.clearLayers();
    iglesiaMarkersRef.current = [];

    if (!focusedMunicipioId) {
      if (!map.hasLayer(municipiosLayer)) map.addLayer(municipiosLayer);
      if (map.hasLayer(iglesiasLayer)) map.removeLayer(iglesiasLayer);
      map.flyTo(CUNDINAMARCA_CENTER, 9);
      return;
    }

    const municipio = municipios.find((m) => m.id === focusedMunicipioId);
    if (!municipio) return;

    if (map.hasLayer(municipiosLayer)) map.removeLayer(municipiosLayer);

    const iglesiasDelMunicipio = iglesias.filter((i) => i.municipio === municipio.nombre);

    iglesiasDelMunicipio.forEach((ig) => {
      const marker = L.marker([ig.lat, ig.lng], { icon: iglesiaPinIcon(ig) }).addTo(iglesiasLayer);
      const pastorTxt = ig.pastor ? `Pastor: ${ig.pastor}` : "";
      bindPermanentTooltip(
        marker,
        `<div style="font-family:inherit;line-height:1.25;">
           <div style="font-weight:700;font-size:12px;color:#0f172a;">${ig.nombre}</div>
           ${pastorTxt ? `<div style="font-size:10px;color:#64748b;">${pastorTxt}</div>` : ""}
         </div>`
      );
      marker.on("click", () => router.push(`/iglesias/${ig.id}`));
      iglesiaMarkersRef.current.push(marker);
    });

    applyTooltipVisibility(iglesiaMarkersRef.current, FOCUS_ZOOM);
    if (!map.hasLayer(iglesiasLayer)) map.addLayer(iglesiasLayer);
    map.flyTo([municipio.lat, municipio.lng], FOCUS_ZOOM);
  }, [focusedMunicipioId, municipios, iglesias, router]);

  return <div ref={containerRef} className="h-full w-full" />;
}
