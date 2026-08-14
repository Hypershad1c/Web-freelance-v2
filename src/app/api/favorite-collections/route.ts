import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getUserId() {
  const session = await auth();
  return session?.user?.id ?? null;
}

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ collections: [], authenticated: false });

  const collections = await prisma.favoriteCollection.findMany({
    where: { userId },
    include: { favorites: { include: { property: { include: { city: true, media: { orderBy: { order: "asc" } } } } } } },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json({ collections, authenticated: true });
}

export async function POST(request: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });

  const body = (await request.json().catch(() => null)) as { name?: string; color?: string; propertyId?: string } | null;
  const name = body?.name?.trim();
  if (!name || name.length > 60) return NextResponse.json({ error: "Nom de collection invalide." }, { status: 400 });

  const collection = await prisma.favoriteCollection.create({ data: { userId, name, color: body?.color?.trim() || null } });
  if (body?.propertyId) {
    await prisma.favorite.upsert({
      where: { userId_propertyId: { userId, propertyId: body.propertyId } },
      update: { collectionId: collection.id },
      create: { userId, propertyId: body.propertyId, collectionId: collection.id },
    });
  }
  return NextResponse.json(collection, { status: 201 });
}

export async function PATCH(request: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });

  const body = (await request.json().catch(() => null)) as { id?: string; name?: string; color?: string; propertyId?: string; collectionId?: string | null } | null;
  if (!body?.id && !body?.propertyId) return NextResponse.json({ error: "Identifiant requis." }, { status: 400 });

  if (body.id) {
    const collection = await prisma.favoriteCollection.updateMany({ where: { id: body.id, userId }, data: { ...(body.name?.trim() ? { name: body.name.trim() } : {}), ...(body.color ? { color: body.color } : {}) } });
    return NextResponse.json({ updated: collection.count > 0 });
  }

  const favorite = await prisma.favorite.updateMany({ where: { userId, propertyId: body.propertyId }, data: { collectionId: body.collectionId ?? null } });
  return NextResponse.json({ updated: favorite.count > 0 });
}

export async function DELETE(request: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  const body = (await request.json().catch(() => null)) as { id?: string } | null;
  if (!body?.id) return NextResponse.json({ error: "Identifiant requis." }, { status: 400 });
  const deleted = await prisma.favoriteCollection.deleteMany({ where: { id: body.id, userId } });
  return NextResponse.json({ deleted: deleted.count > 0 });
}
