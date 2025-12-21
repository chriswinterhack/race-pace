"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface ElevationPoint {
  mile: number;
  elevation: number;
  lat: number;
  lon: number;
  gradient: number;
}

interface AidStation {
  name: string;
  mile: number;
  cutoff?: string;
}

interface CourseMapProps {
  points: ElevationPoint[];
  aidStations: AidStation[];
}

// Find the closest point on the route to a given mile marker
function findPointAtMile(points: ElevationPoint[], targetMile: number): ElevationPoint | null {
  if (points.length === 0) return null;

  const firstPoint = points[0];
  if (!firstPoint) return null;

  let closest: ElevationPoint = firstPoint;
  let minDiff = Math.abs(closest.mile - targetMile);

  for (const point of points) {
    const diff = Math.abs(point.mile - targetMile);
    if (diff < minDiff) {
      minDiff = diff;
      closest = point;
    }
  }

  return closest;
}

export default function CourseMap({ points, aidStations }: CourseMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    // Skip if no points, no container, or not in browser
    if (points.length === 0 || !mapContainerRef.current || typeof window === "undefined") return;

    // If map already exists, remove it first
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Fix default marker icon paths for bundlers
    delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });

    // Calculate center and bounds
    const latlngs = points.map((p) => [p.lat, p.lon] as L.LatLngTuple);
    const bounds = L.latLngBounds(latlngs);

    // Create map
    const map = L.map(mapContainerRef.current, {
      scrollWheelZoom: true,
    });
    mapInstanceRef.current = map;

    // Add tile layer
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    // Fit bounds with padding
    map.fitBounds(bounds, { padding: [30, 30] });

    // Add route polyline
    L.polyline(latlngs, {
      color: "#0ea5e9",
      weight: 4,
      opacity: 0.9,
    }).addTo(map);

    // Start marker with custom icon
    const startPoint = points[0];
    if (startPoint) {
      const startIcon = L.divIcon({
        className: "custom-start-marker",
        html: `<div style="
          width: 28px;
          height: 28px;
          background: linear-gradient(135deg, #22c55e, #16a34a);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 14px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          border: 2px solid white;
        ">S</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      L.marker([startPoint.lat, startPoint.lon], { icon: startIcon })
        .bindPopup(`
          <div style="text-align: center; padding: 4px;">
            <p style="font-weight: bold; color: #22c55e; margin: 0 0 4px 0;">Start</p>
            <p style="font-size: 12px; color: #666; margin: 0;">Elevation: ${startPoint.elevation.toLocaleString()} ft</p>
          </div>
        `)
        .addTo(map);
    }

    // Finish marker
    const endPoint = points[points.length - 1];
    if (endPoint && (points.length === 1 || endPoint !== startPoint)) {
      const finishIcon = L.divIcon({
        className: "custom-finish-marker",
        html: `<div style="
          width: 28px;
          height: 28px;
          background: linear-gradient(135deg, #ef4444, #dc2626);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 14px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          border: 2px solid white;
        ">F</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      L.marker([endPoint.lat, endPoint.lon], { icon: finishIcon })
        .bindPopup(`
          <div style="text-align: center; padding: 4px;">
            <p style="font-weight: bold; color: #ef4444; margin: 0 0 4px 0;">Finish</p>
            <p style="font-size: 12px; color: #666; margin: 0;">Mile ${endPoint.mile} • ${endPoint.elevation.toLocaleString()} ft</p>
          </div>
        `)
        .addTo(map);
    }

    // Aid station markers
    const aidIcon = L.divIcon({
      className: "custom-aid-marker",
      html: `<div style="
        width: 22px;
        height: 22px;
        background: linear-gradient(135deg, #0ea5e9, #0284c7);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 12px;
        box-shadow: 0 2px 6px rgba(0,0,0,0.25);
        border: 2px solid white;
      ">A</div>`,
      iconSize: [22, 22],
      iconAnchor: [11, 11],
    });

    aidStations.forEach((station) => {
      const stationPoint = findPointAtMile(points, station.mile);
      if (stationPoint) {
        L.marker([stationPoint.lat, stationPoint.lon], { icon: aidIcon })
          .bindPopup(`
            <div style="text-align: center; padding: 4px;">
              <p style="font-weight: bold; color: #0ea5e9; margin: 0 0 4px 0;">${station.name}</p>
              <p style="font-size: 12px; color: #666; margin: 0;">Mile ${station.mile}</p>
              ${station.cutoff ? `<p style="font-size: 12px; color: #f97316; margin: 4px 0 0 0;">Cutoff: ${station.cutoff}</p>` : ""}
            </div>
          `)
          .addTo(map);
      }
    });

    // Cleanup
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [points, aidStations]);

  if (points.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center bg-brand-navy-50 rounded-lg">
        <p className="text-brand-navy-500">No route data available</p>
      </div>
    );
  }

  return (
    <div
      ref={mapContainerRef}
      className="h-80 rounded-lg overflow-hidden shadow-inner border border-brand-navy-200"
      style={{ minHeight: "320px" }}
    />
  );
}
