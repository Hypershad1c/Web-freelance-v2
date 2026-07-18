import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding Domify reference data...");

  const propertyTypes = [
    { name: "Appartement", slug: "appartement", icon: "building" },
    { name: "Villa", slug: "villa", icon: "home" },
    { name: "Duplex", slug: "duplex", icon: "layers" },
    { name: "Terrain", slug: "terrain", icon: "map" },
    { name: "Riad", slug: "riad", icon: "landmark" },
    { name: "Bureau", slug: "bureau", icon: "briefcase" },
  ];
  for (const t of propertyTypes) {
    await prisma.propertyType.upsert({ where: { slug: t.slug }, update: {}, create: t });
  }

  const amenities = [
    { name: "Piscine", slug: "piscine", icon: "waves" },
    { name: "Jardin privatif", slug: "jardin-privatif", icon: "trees" },
    { name: "Garage 2 voitures", slug: "garage-2-voitures", icon: "car" },
    { name: "Domotique", slug: "domotique", icon: "cpu" },
    { name: "Climatisation", slug: "climatisation", icon: "wind" },
    { name: "Sécurité 24/7", slug: "securite-24-7", icon: "shield" },
    { name: "Salle de sport", slug: "salle-de-sport", icon: "dumbbell" },
    { name: "Vue mer", slug: "vue-mer", icon: "waves" },
  ];
  for (const a of amenities) {
    await prisma.amenity.upsert({ where: { slug: a.slug }, update: {}, create: a });
  }

  const cities = [
    { name: "Casablanca", slug: "casablanca" },
    { name: "Rabat", slug: "rabat" },
    { name: "Marrakech", slug: "marrakech" },
    { name: "Tanger", slug: "tanger" },
    { name: "Bouskoura", slug: "bouskoura" },
    { name: "Agadir", slug: "agadir" },
  ];
  for (const c of cities) {
    await prisma.city.upsert({ where: { slug: c.slug }, update: {}, create: c });
  }

  const rabat = await prisma.city.findUnique({ where: { slug: "rabat" } });
  const casablanca = await prisma.city.findUnique({ where: { slug: "casablanca" } });

  if (rabat) {
    await prisma.neighborhood.upsert({
      where: { slug: "souissi" },
      update: {},
      create: { name: "Souissi", slug: "souissi", cityId: rabat.id },
    });
    await prisma.neighborhood.upsert({
      where: { slug: "hay-riad" },
      update: {},
      create: { name: "Hay Riad", slug: "hay-riad", cityId: rabat.id },
    });
  }
  if (casablanca) {
    await prisma.neighborhood.upsert({
      where: { slug: "racine" },
      update: {},
      create: { name: "Racine", slug: "racine", cityId: casablanca.id },
    });
    await prisma.neighborhood.upsert({
      where: { slug: "maarif" },
      update: {},
      create: { name: "Maarif", slug: "maarif", cityId: casablanca.id },
    });
  }

  const adminPassword = await bcrypt.hash("Domify2026!", 12);
  await prisma.user.upsert({
    where: { email: "admin@domify.ma" },
    update: {},
    create: {
      name: "Admin Domify",
      email: "admin@domify.ma",
      password: adminPassword,
      role: "ADMIN",
    },
  });

  const agency = await prisma.agency.upsert({
    where: { slug: "domify-prestige" },
    update: {},
    create: {
      name: "Domify Prestige",
      slug: "domify-prestige",
      description: "Agence premium spécialisée dans l'immobilier de luxe au Maroc.",
      phone: "+212 6 12 34 56 78",
      email: "contact@domify-prestige.ma",
      address: "123, Bd Mohammed V, Casablanca",
      verified: true,
    },
  });

  await prisma.agent.upsert({
    where: { slug: "yasmine-el-amrani" },
    update: {},
    create: {
      name: "Yasmine El Amrani",
      slug: "yasmine-el-amrani",
      bio: "10 ans d'expérience dans l'immobilier résidentiel haut de gamme.",
      phone: "+212 6 12 34 56 78",
      email: "yasmine@domify.ma",
      agencyId: agency.id,
    },
  });

  await prisma.blogCategory.upsert({
    where: { slug: "marche-immobilier" },
    update: {},
    create: { name: "Marché immobilier", slug: "marche-immobilier" },
  });
  await prisma.blogCategory.upsert({
    where: { slug: "conseils" },
    update: {},
    create: { name: "Conseils", slug: "conseils" },
  });

  console.log("Seed complete. Admin login: admin@domify.ma / Domify2026!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });