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

  // Test AGENT-role account, linked to the Yasmine agent profile via userId, so
  // the Agent dashboard (/admin, scoped views) has real data to show.
  const agentPassword = await bcrypt.hash("Domify2026!", 12);
  const agentUser = await prisma.user.upsert({
    where: { email: "yasmine@domify.ma" },
    update: {},
    create: {
      name: "Yasmine El Amrani",
      email: "yasmine@domify.ma",
      password: agentPassword,
      role: "AGENT",
    },
  });

  await prisma.agent.upsert({
    where: { slug: "yasmine-el-amrani" },
    update: { userId: agentUser.id },
    create: {
      name: "Yasmine El Amrani",
      slug: "yasmine-el-amrani",
      bio: "10 ans d'expérience dans l'immobilier résidentiel haut de gamme.",
      phone: "+212 6 12 34 56 78",
      email: "yasmine@domify.ma",
      agencyId: agency.id,
      userId: agentUser.id,
    },
  });

  // Test plain USER account (for /compte — favorites, leads, appointments history).
  const testUserPassword = await bcrypt.hash("Domify2026!", 12);
  await prisma.user.upsert({
    where: { email: "client@domify.ma" },
    update: {},
    create: {
      name: "Sara Bennani",
      email: "client@domify.ma",
      password: testUserPassword,
      role: "USER",
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

  // Sample published properties so the public site isn't empty on first run.
  const villaType = await prisma.propertyType.findUnique({ where: { slug: "villa" } });
  const apartmentType = await prisma.propertyType.findUnique({ where: { slug: "appartement" } });
  const souissi = await prisma.neighborhood.findUnique({ where: { slug: "souissi" } });
  const racine = await prisma.neighborhood.findUnique({ where: { slug: "racine" } });
  const agent = await prisma.agent.findUnique({ where: { slug: "yasmine-el-amrani" } });
  const piscine = await prisma.amenity.findUnique({ where: { slug: "piscine" } });
  const securite = await prisma.amenity.findUnique({ where: { slug: "securite-24-7" } });

  if (rabat && villaType) {
    const existing = await prisma.property.findUnique({ where: { reference: "DOM-1001" } });
    if (!existing) {
      await prisma.property.create({
        data: {
          reference: "DOM-1001",
          title: "Villa contemporaine avec piscine",
          slug: "villa-contemporaine-souissi-rabat",
          description:
            "Somptueuse villa familiale à Souissi, l'un des quartiers les plus prisés de Rabat. Grand jardin arboré, piscine chauffée, suite parentale avec dressing et salle de cinéma privée.",
          listingType: "VENTE",
          status: "PUBLISHED",
          price: 7800000,
          surfaceArea: 600,
          bedrooms: 6,
          bathrooms: 5,
          yearBuilt: 2019,
          featured: true,
          latitude: 33.9622,
          longitude: -6.8592,
          address: "Souissi, Rabat",
          cityId: rabat.id,
          neighborhoodId: souissi?.id,
          propertyTypeId: villaType.id,
          agencyId: agency.id,
          agentId: agent?.id,
          amenities: { connect: [piscine, securite].filter(Boolean).map((a) => ({ id: a!.id })) },
          media: {
            create: [
              {
                url: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?q=80&w=1600&auto=format&fit=crop",
                order: 0,
                type: "image",
              },
              {
                url: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?q=80&w=1600&auto=format&fit=crop",
                order: 1,
                type: "image",
              },
            ],
          },
        },
      });
    }
  }

  if (casablanca && apartmentType) {
    const existing = await prisma.property.findUnique({ where: { reference: "DOM-1002" } });
    if (!existing) {
      await prisma.property.create({
        data: {
          reference: "DOM-1002",
          title: "Appartement moderne à Racine",
          slug: "appartement-moderne-racine-casablanca",
          description:
            "Appartement lumineux au cœur de Racine, dans une résidence sécurisée avec ascenseur et parking. Cuisine équipée, double exposition et finitions soignées.",
          listingType: "VENTE",
          status: "PUBLISHED",
          price: 2350000,
          surfaceArea: 120,
          bedrooms: 3,
          bathrooms: 2,
          yearBuilt: 2020,
          featured: true,
          latitude: 33.5876,
          longitude: -7.6382,
          address: "Racine, Casablanca",
          cityId: casablanca.id,
          neighborhoodId: racine?.id,
          propertyTypeId: apartmentType.id,
          agencyId: agency.id,
          agentId: agent?.id,
          amenities: { connect: securite ? [{ id: securite.id }] : [] },
          media: {
            create: [
              {
                url: "https://images.unsplash.com/photo-1613977257363-707ba9348227?q=80&w=1600&auto=format&fit=crop",
                order: 0,
                type: "image",
              },
            ],
          },
        },
      });
    }
  }

  // Sample blog posts so /blog isn't empty on first run.
  const marcheCategory = await prisma.blogCategory.findUnique({ where: { slug: "marche-immobilier" } });
  const conseilsCategory = await prisma.blogCategory.findUnique({ where: { slug: "conseils" } });

  await prisma.blogPost.upsert({
    where: { slug: "marche-immobilier-maroc-2026" },
    update: {},
    create: {
      title: "Le marché immobilier au Maroc en 2026",
      slug: "marche-immobilier-maroc-2026",
      excerpt: "Un aperçu des tendances de prix et de la demande dans les grandes villes marocaines.",
      content:
        "Le marché immobilier marocain continue de montrer des signes de dynamisme en 2026, porté par une demande soutenue dans les grandes métropoles.\n\nCasablanca et Rabat restent les marchés les plus actifs, avec une demande particulièrement forte pour les biens de standing dans les quartiers centraux.\n\nLes villes secondaires comme Marrakech et Tanger attirent également de plus en plus d'investisseurs, notamment grâce au développement du tourisme et des infrastructures.",
      coverImage: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200&auto=format&fit=crop",
      published: true,
      categoryId: marcheCategory?.id,
    },
  });

  await prisma.blogPost.upsert({
    where: { slug: "5-conseils-acheter-au-meilleur-prix" },
    update: {},
    create: {
      title: "5 conseils pour acheter au meilleur prix",
      slug: "5-conseils-acheter-au-meilleur-prix",
      excerpt: "Nos experts partagent leurs meilleures pratiques pour négocier efficacement.",
      content:
        "Acheter un bien immobilier est l'une des décisions financières les plus importantes de votre vie. Voici cinq conseils pour vous aider à négocier au meilleur prix.\n\nPremièrement, faites vos recherches sur le marché local avant de faire une offre. Comparez plusieurs biens similaires pour avoir une idée juste du prix au mètre carré.\n\nDeuxièmement, n'hésitez pas à faire appel à un professionnel pour vous accompagner dans la négociation et l'évaluation du bien.",
      coverImage: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=1200&auto=format&fit=crop",
      published: true,
      categoryId: conseilsCategory?.id,
    },
  });

  // Sample testimonials for the homepage.
  const testimonialCount = await prisma.testimonial.count();
  if (testimonialCount === 0) {
    await prisma.testimonial.createMany({
      data: [
        {
          name: "Sara Bennani",
          city: "Casablanca",
          quote: "Grâce à Domify, j'ai trouvé la maison de mes rêves. Service professionnel et réactif du début à la fin.",
          rating: 5,
          published: true,
        },
        {
          name: "Karim El Fassi",
          city: "Rabat",
          quote: "Une équipe à l'écoute et un accompagnement irréprochable pour l'achat de notre villa à Souissi.",
          rating: 5,
          published: true,
        },
        {
          name: "Nadia Alaoui",
          city: "Marrakech",
          quote: "L'estimation gratuite était d'une précision surprenante, et la vente s'est conclue en moins de deux mois.",
          rating: 5,
          published: true,
        },
      ],
    });
  }

  console.log("Seed complete.");
  console.log("Admin login:  admin@domify.ma / Domify2026!");
  console.log("Agent login:  yasmine@domify.ma / Domify2026!");
  console.log("User login:   client@domify.ma / Domify2026!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
