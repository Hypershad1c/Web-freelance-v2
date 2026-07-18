import type { Metadata } from "next";
import { PropertiesExplorer } from "@/components/properties/PropertiesExplorer";

export const metadata: Metadata = {
  title: "Propriétés à vendre et à louer | Domify",
  description: "Parcourez notre sélection de villas, appartements, duplex et riads d'exception partout au Maroc.",
};

export default function PropertiesPage() {
  return <PropertiesExplorer />;
}
