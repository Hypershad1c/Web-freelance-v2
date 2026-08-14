"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Link from "next/link";
import { formatMAD } from "@/lib/utils";

function createPin(color: string, size: number) {
  return L.divIcon({
    className: "",
    html: `<div style="width:${size}px;height:${size}px;border-radius:50% 50% 50% 0;background:${color};transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;box-shadow:0 5px 14px rgba(0,0,0,0.28);"><div style="width:${Math.max(8, size / 3)}px;height:${Math.max(8, size / 3)}px;border-radius:50%;background:white;transform:rotate(45deg);"></div></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size + 2],
  });
}

const goldPin = createPin("#CD9C20", 30);
const activePin = createPin("#132C45", 36);

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
  selectedId,
  onSelect,
}: {
  properties: MapProperty[];
  center?: [number, number];
  zoom?: number;
  height?: number;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
}) {
  const mapCenter: [number, number] = center ?? (properties.length > 0 ? [properties[0].latitude, properties[0].longitude] : [33.5731, -7.5898]);

  return (
    <div style={{ height }} className="overflow-hidden rounded-[1.4rem] border border-domify-dark/8 shadow-[0_20px_50px_-30px_rgba(16,47,66,0.45)]">
      <MapContainer center={mapCenter} zoom={zoom} scrollWheelZoom style={{ height: "100%", width: "100%" }}>
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {properties.map((property) => (
          <Marker key={property.id} position={[property.latitude, property.longitude]} icon={selectedId === property.id ? activePin : goldPin} eventHandlers={{ click: () => onSelect?.(property.id) }}>
            <Popup>
              <div className="min-w-[180px]">
                <p className="font-semibold text-domify-dark">{property.title}</p>
                <p className="mt-1 text-sm font-bold text-domify-gold">{formatMAD(property.price)}{property.listingType === "LOCATION" && " /mois"}</p>
                <Link href={`/proprietes/${property.id}`} className="mt-2 inline-block text-xs font-semibold text-domify-primary hover:underline">Voir le bien →</Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
