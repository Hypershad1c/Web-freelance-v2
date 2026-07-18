// TEMPORARY sample data for the UI preview phase.
// In the full build this is replaced by Prisma queries against PostgreSQL
// (see prisma/schema.prisma for the real Property model).

export type Property = {
  id: string;
  reference: string;
  title: string;
  city: string;
  neighborhood: string;
  price: number;
  type: "vente" | "location";
  propertyType: "Appartement" | "Villa" | "Duplex" | "Terrain" | "Riad";
  bedrooms: number;
  bathrooms: number;
  area: number;
  yearBuilt: number;
  image: string;
  gallery: string[];
  badge?: string;
  featured?: boolean;
  description: string;
  amenities: string[];
  agent: { name: string; agency: string; phone: string; email: string; photo: string };
};

const AGENT = {
  name: "Abdelhamid Bourazzouq",
  agency: "Domify Prestige",
  phone: "+212 6 12 34 56 78",
  email: "abdelhamid@domify.ma",
  photo: "https://res.cloudinary.com/di00pq8bf/image/upload/v1775667282/ecommerce_products/gfahcexnlq6whjqy9vdx.jpg",
};

const AMENITIES = [
  "Piscine",
  "Jardin privatif",
  "Garage 2 voitures",
  "Domotique",
  "Climatisation",
  "Sécurité 24/7",
  "Salle de sport",
  "Vue mer",
];

export const properties: Property[] = [
  {
    id: "1",
    reference: "DOM-1001",
    title: "Villa contemporaine",
    city: "Bouskoura",
    neighborhood: "Bouskoura Golf City",
    price: 5600000,
    type: "vente",
    propertyType: "Villa",
    bedrooms: 4,
    bathrooms: 4,
    area: 450,
    yearBuilt: 2022,
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200&auto=format&fit=crop",
    gallery: [
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=1600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1613977257363-707ba9348227?q=80&w=1600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?q=80&w=1600&auto=format&fit=crop",
    ],
    badge: "Villa d'exception",
    featured: true,
    description:
      "Villa contemporaine de standing nichée au cœur de Bouskoura Golf City. Volumes généreux, finitions haut de gamme et prestations premium : cette propriété conjugue élégance architecturale et confort de vie moderne, avec un jardin paysager et une piscine à débordement.",
    amenities: AMENITIES.slice(0, 6),
    agent: AGENT,
  },
  {
    id: "2",
    reference: "DOM-1002",
    title: "Appartement moderne",
    city: "Casablanca",
    neighborhood: "Racine",
    price: 2350000,
    type: "vente",
    propertyType: "Appartement",
    bedrooms: 3,
    bathrooms: 2,
    area: 120,
    yearBuilt: 2020,
    image: "https://images.unsplash.com/photo-1613977257363-707ba9348227?q=80&w=1200&auto=format&fit=crop",
    gallery: [
      "https://images.unsplash.com/photo-1613977257363-707ba9348227?q=80&w=1600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=1600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=1600&auto=format&fit=crop",
    ],
    badge: "Appartement neuf",
    featured: true,
    description:
      "Appartement lumineux au cœur de Racine, dans une résidence sécurisée avec ascenseur et parking. Cuisine équipée, double exposition et finitions soignées en font un bien idéal pour une famille active en centre-ville.",
    amenities: ["Climatisation", "Sécurité 24/7", "Garage 2 voitures"],
    agent: AGENT,
  },
  {
    id: "3",
    reference: "DOM-1003",
    title: "Villa avec piscine",
    city: "Rabat",
    neighborhood: "Souissi",
    price: 7800000,
    type: "vente",
    propertyType: "Villa",
    bedrooms: 6,
    bathrooms: 5,
    area: 600,
    yearBuilt: 2019,
    image: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?q=80&w=1200&auto=format&fit=crop",
    gallery: [
      "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?q=80&w=1600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?q=80&w=1600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?q=80&w=1600&auto=format&fit=crop",
    ],
    badge: "Villa de luxe",
    featured: true,
    description:
      "Somptueuse villa familiale à Souissi, l'un des quartiers les plus prisés de Rabat. Grand jardin arboré, piscine chauffée, suite parentale avec dressing et salle de cinéma privée : une propriété pensée pour recevoir.",
    amenities: AMENITIES,
    agent: AGENT,
  },
  {
    id: "4",
    reference: "DOM-1004",
    title: "Duplex moderne",
    city: "Casablanca",
    neighborhood: "Bourgogne",
    price: 3200000,
    type: "vente",
    propertyType: "Duplex",
    bedrooms: 3,
    bathrooms: 3,
    area: 160,
    yearBuilt: 2021,
    image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=1200&auto=format&fit=crop",
    gallery: [
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=1600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=1600&auto=format&fit=crop",
    ],
    badge: "Duplex haut standing",
    featured: true,
    description:
      "Duplex haut standing avec terrasse panoramique sur Bourgogne. Deux niveaux baignés de lumière, cuisine américaine et suite parentale avec balcon privé.",
    amenities: ["Climatisation", "Sécurité 24/7", "Vue mer"],
    agent: AGENT,
  },
  {
    id: "5",
    reference: "DOM-1005",
    title: "Villa avec piscine",
    city: "Rabat",
    neighborhood: "Hay Riad",
    price: 9100000,
    type: "vente",
    propertyType: "Villa",
    bedrooms: 5,
    bathrooms: 5,
    area: 560,
    yearBuilt: 2023,
    image: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?q=80&w=1200&auto=format&fit=crop",
    gallery: [
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?q=80&w=1600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1600&auto=format&fit=crop",
    ],
    featured: true,
    description:
      "Villa neuve à Hay Riad avec architecture contemporaine, grandes baies vitrées et espace extérieur aménagé pour la détente et la réception.",
    amenities: AMENITIES.slice(1, 7),
    agent: AGENT,
  },
  {
    id: "6",
    reference: "DOM-1006",
    title: "Appartement vue mer",
    city: "Tanger",
    neighborhood: "Malabata",
    price: 1950000,
    type: "vente",
    propertyType: "Appartement",
    bedrooms: 2,
    bathrooms: 2,
    area: 95,
    yearBuilt: 2022,
    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1200&auto=format&fit=crop",
    gallery: [
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1600210492493-0946911123ea?q=80&w=1600&auto=format&fit=crop",
    ],
    badge: "Vue mer",
    description:
      "Appartement avec vue imprenable sur la baie de Tanger, à deux pas de la corniche de Malabata. Résidence de standing avec piscine commune et salle de sport.",
    amenities: ["Vue mer", "Salle de sport", "Sécurité 24/7"],
    agent: AGENT,
  },
  {
    id: "7",
    reference: "DOM-1007",
    title: "Riad de charme",
    city: "Marrakech",
    neighborhood: "Médina",
    price: 4500000,
    type: "vente",
    propertyType: "Riad",
    bedrooms: 5,
    bathrooms: 5,
    area: 320,
    yearBuilt: 2015,
    image: "https://images.unsplash.com/photo-1548013146-72479768bada?q=80&w=1200&auto=format&fit=crop",
    gallery: [
      "https://images.unsplash.com/photo-1548013146-72479768bada?q=80&w=1600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1587985064135-0366536eab42?q=80&w=1600&auto=format&fit=crop",
    ],
    badge: "Authentique",
    description:
      "Riad entièrement restauré au cœur de la Médina de Marrakech, patio central avec fontaine en zellige, terrasse panoramique sur les toits de la ville.",
    amenities: ["Piscine", "Jardin privatif", "Domotique"],
    agent: AGENT,
  },
  {
    id: "8",
    reference: "DOM-1008",
    title: "Appartement à louer",
    city: "Casablanca",
    neighborhood: "Maarif",
    price: 12000,
    type: "location",
    propertyType: "Appartement",
    bedrooms: 2,
    bathrooms: 1,
    area: 85,
    yearBuilt: 2018,
    image: "https://images.unsplash.com/photo-1560184897-ae75f418493e?q=80&w=1200&auto=format&fit=crop",
    gallery: [
      "https://images.unsplash.com/photo-1560184897-ae75f418493e?q=80&w=1600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=1600&auto=format&fit=crop",
    ],
    badge: "À louer",
    description:
      "Appartement meublé et équipé à Maarif, quartier animé proche commerces et transports. Idéal pour une location longue durée.",
    amenities: ["Climatisation", "Sécurité 24/7"],
    agent: AGENT,
  },
];

export const featuredProperties = properties.filter((p) => p.featured);

export function getPropertyById(id: string) {
  return properties.find((p) => p.id === id);
}

export function getSimilarProperties(property: Property, count = 3) {
  return properties
    .filter((p) => p.id !== property.id && p.city === property.city)
    .concat(properties.filter((p) => p.id !== property.id && p.city !== property.city))
    .slice(0, count);
}

export const cities = Array.from(new Set(properties.map((p) => p.city)));
export const propertyTypes = Array.from(new Set(properties.map((p) => p.propertyType)));
