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

    const hasHover = window.matchMedia("(hover: hover)").matches;

    const municipiosLayer = L.layerGroup().addTo(map);
    municipiosLayerRef.current = municipiosLayer;
    iglesiasLayerRef.current = L.layerGroup();

    municipios.forEach((m) => {
      const marker = L.marker([m.lat, m.lng], { icon: pinIcon(m) }).addTo(municipiosLayer);
      const habitantesTxt = m.habitantes ? `${m.habitantes.toLocaleString("es-CO")} habitantes` : "Dato pendiente";
      const flagImg = m.banderaUrl
        ? `<img src="${m.banderaUrl}" style="width:32px;height:32px;border-radius:6px;object-fit:cover;flex-shrink:0" />`
        : "";
      const verPerfilLink = hasHover
        ? ""
        : `<a href="/municipios/${m.id}" style="display:block;margin-top:6px;font-size:11px;font-weight:600;color:#003893;">Ver perfil →</a>`;
      marker.bindPopup(
        `<div style="font-family:inherit;">
           <div style="display:flex;align-items:center;gap:8px;">
             ${flagImg}
             <div>
               <div style="font-weight:600;font-size:13px;color:#0f172a;">${m.nombre}</div>
               <div style="font-size:11px;color:#64748b;">${habitantesTxt}</div>
             </div>
           </div>
           ${verPerfilLink}
         </div>`,
        { closeButton: !hasHover, offset: [0, -4] }
      );

      if (hasHover) {
        // Escritorio: la info aparece al pasar el cursor, y clic navega directo al perfil.
        marker.on("mouseover", () => marker.openPopup());
        marker.on("mouseout", () => marker.closePopup());
        marker.on("click", () => {
          router.push(`/municipios/${m.id}`);
        });
      }
      // Táctil (sin hover): el propio tap de bindPopup abre el popup de inmediato;
      // navegar requiere un segundo tap sobre el enlace "Ver perfil".
    });

    return () => {
      map.remove();
      mapRef.current = null;
      municipiosLayerRef.current = null;
      iglesiasLayerRef.current = null;
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

    if (!focusedMunicipioId) {
      if (!map.hasLayer(municipiosLayer)) map.addLayer(municipiosLayer);
      if (map.hasLayer(iglesiasLayer)) map.removeLayer(iglesiasLayer);
      map.flyTo(CUNDINAMARCA_CENTER, 9);
      return;
    }

    const municipio = municipios.find((m) => m.id === focusedMunicipioId);
    if (!municipio) return;

    if (map.hasLayer(municipiosLayer)) map.removeLayer(municipiosLayer);

    const hasHover = window.matchMedia("(hover: hover)").matches;
    const iglesiasDelMunicipio = iglesias.filter((i) => i.municipio === municipio.nombre);

    iglesiasDelMunicipio.forEach((ig) => {
      const marker = L.marker([ig.lat, ig.lng], { icon: iglesiaPinIcon(ig) }).addTo(iglesiasLayer);
      const pastorTxt = ig.pastor ? `Pastor: ${ig.pastor}` : "";
      const logoImg = ig.logoUrl
        ? `<img src="${ig.logoUrl}" style="width:32px;height:32px;border-radius:6px;object-fit:cover;flex-shrink:0" />`
        : "";
      const verPerfilLink = hasHover
        ? ""
        : `<a href="/iglesias/${ig.id}" style="display:block;margin-top:6px;font-size:11px;font-weight:600;color:#047857;">Ver perfil →</a>`;
      marker.bindPopup(
        `<div style="font-family:inherit;">
           <div style="display:flex;align-items:center;gap:8px;">
             ${logoImg}
             <div>
               <div style="font-weight:600;font-size:13px;color:#0f172a;">${ig.nombre}</div>
               ${pastorTxt ? `<div style="font-size:11px;color:#64748b;">${pastorTxt}</div>` : ""}
             </div>
           </div>
           ${verPerfilLink}
         </div>`,
        { closeButton: !hasHover, offset: [0, -4] }
      );
      if (hasHover) {
        marker.on("mouseover", () => marker.openPopup());
        marker.on("mouseout", () => marker.closePopup());
        marker.on("click", () => router.push(`/iglesias/${ig.id}`));
      }
    });

    if (!map.hasLayer(iglesiasLayer)) map.addLayer(iglesiasLayer);
    map.flyTo([municipio.lat, municipio.lng], FOCUS_ZOOM);
  }, [focusedMunicipioId, municipios, iglesias, router]);

  return <div ref={containerRef} className="h-full w-full" />;
}
