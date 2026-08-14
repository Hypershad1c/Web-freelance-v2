import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });

  const body = (await request.json().catch(() => null)) as { cityId?: string; propertyTypeId?: string; listingType?: "VENTE" | "LOCATION"; minPrice?: number; maxPrice?: number; bedrooms?: number; purpose?: string } | null;
  if (!body?.cityId && !body?.propertyTypeId && !body?.purpose) return NextResponse.json({ error: "Préférences insuffisantes." }, { status: 400 });

  const contact = await prisma.crmContact.upsert({
    where: { email: session.user.email },
    update: { name: session.user.name || session.user.email.split("@")[0], budgetMin: body.minPrice || undefined, budgetMax: body.maxPrice || undefined, preferredLocation: body.cityId || undefined, notes: body.purpose ? `Projet acheteur : ${body.purpose}` : undefined },
    create: { name: session.user.name || session.user.email.split("@")[0], email: session.user.email, budgetMin: body.minPrice || null, budgetMax: body.maxPrice || null, preferredLocation: body.cityId || null, notes: body.purpose ? `Projet acheteur : ${body.purpose}` : null, ownerId: null },
  });

  const savedSearch = await prisma.crmSavedSearch.create({ data: { userId: session.user.id, name: body.purpose ? `Projet ${body.purpose}` : "Ma recherche Domify", listingType: body.listingType || null, minPrice: body.minPrice || null, maxPrice: body.maxPrice || null, bedrooms: body.bedrooms || null, cityId: body.cityId || null, propertyTypeId: body.propertyTypeId || null, channel: "IN_APP" } });
  return NextResponse.json({ contactId: contact.id, savedSearchId: savedSearch.id }, { status: 201 });
}
