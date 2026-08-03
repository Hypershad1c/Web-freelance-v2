"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Link from "next/link";
import { formatMAD } from "@/lib/utils";

// Leaflet's default marker icons reference image files in a way that breaks under
// bundlers (Next.js/Turbopack included) unless patched. A styled divIcon sidesteps
// the problem entirely and looks better than the default pin anyway.
const goldPin = L.divIcon({
  className: "",
  html: `<div style="
    width: 30px; height: 30px; border-radius: 50% 50% 50% 0;
    background: #CD9C20; transform: rotate(-45deg);
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 4px 10px rgba(0,0,0,0.3);
  "><div style="width: 10px; height: 10px; border-radius: 50%; background: white; transform: rotate(45deg);"></div></div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -28],
});

export type MapProperty = {
  id: string;
  title: string;
  price: number;
  listingType: "VENTE" | "LOCATION";
  latitude: number;
  longitude: number;
  image?: string;
};

export function PropertyMap({
  properties,
  center,
  zoom = 12,
  height = 400,
}: {
  properties: MapProperty[];
  center?: [number, number];
  zoom?: number;
  height?: number;
}) {
  const mapCenter: [number, number] =
    center ?? (properties.length > 0 ? [properties[0].latitude, properties[0].longitude] : [33.5731, -7.5898]); // Casablanca fallback

  return (
    <div style={{ height }} className="overflow-hidden rounded-2xl">
      <MapContainer center={mapCenter} zoom={zoom} scrollWheelZoom={false} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {properties.map((p) => (
          <Marker key={p.id} position={[p.latitude, p.longitude]} icon={goldPin}>
            <Popup>
              <div className="min-w-[160px]">
                <p className="font-semibold text-domify-dark">{p.title}</p>
                <p className="mt-1 text-sm font-bold text-domify-gold">
                  {formatMAD(p.price)}
                  {p.listingType === "LOCATION" && " /mois"}
                </p>
                <Link href={`/proprietes/${p.id}`} className="mt-1 inline-block text-xs font-medium text-domify-primary hover:underline">
                  Voir le bien →
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
