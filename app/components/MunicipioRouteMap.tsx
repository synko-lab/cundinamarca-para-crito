"use client";

import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const DESTINO: [number, number] = [4.6155, -74.1761];
const DESTINO_NOMBRE = "IBBF";

function haversineKm(a: [number, number], b: [number, number]) {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const lat1 = (a[0] * Math.PI) / 180;
  const lat2 = (b[0] * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function pointIcon(color: string) {
  return L.divIcon({
    className: "",
    html: `<div style="width:16px;height:16px;border-radius:50%;background:${color};border:3px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.4);"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

export default function MunicipioRouteMap({
  nombre,
  lat,
  lng,
}: {
  nombre: string;
  lat: number;
  lng: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const origen: [number, number] = [lat, lng];
    const map = L.map(containerRef.current, {
      scrollWheelZoom: false,
      zoomControl: false,
    });
    mapRef.current = map;

    L.control.zoom({ position: "bottomright" }).addTo(map);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    L.marker(origen, { icon: pointIcon("#003893") })
      .addTo(map)
      .bindPopup(`<div style="font-family:inherit;font-size:12px;font-weight:600;">${nombre}</div>`, {
        closeButton: false,
      });

    L.marker(DESTINO, { icon: pointIcon("#CE1126") })
      .addTo(map)
      .bindPopup(`<div style="font-family:inherit;font-size:12px;font-weight:600;">${DESTINO_NOMBRE}</div>`, {
        closeButton: false,
      });

    const distanciaKm = haversineKm(origen, DESTINO);

    const line = L.polyline([origen, DESTINO], {
      color: "#CE1126",
      weight: 3,
      dashArray: "6 6",
    }).addTo(map);

    const mid: [number, number] = [(origen[0] + DESTINO[0]) / 2, (origen[1] + DESTINO[1]) / 2];
    L.marker(mid, {
      icon: L.divIcon({
        className: "",
        html: `<div style="white-space:nowrap;background:#fff;border:1px solid #e2e8f0;border-radius:9999px;padding:2px 8px;font-size:11px;font-weight:600;color:#0f172a;box-shadow:0 1px 4px rgba(0,0,0,0.15);">${distanciaKm.toLocaleString(
          "es-CO",
          { maximumFractionDigits: 1 }
        )} km</div>`,
        iconSize: [0, 0],
      }),
      interactive: false,
    }).addTo(map);

    map.fitBounds(line.getBounds(), { padding: [40, 40] });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [nombre, lat, lng]);

  return <div ref={containerRef} className="h-full w-full" />;
}
