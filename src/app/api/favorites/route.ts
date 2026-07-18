import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json([], { status: 200 });

  const favorites = await prisma.favorite.findMany({
    where: { userId: session.user.id },
    include: { property: true },
  });

  return NextResponse.json(favorites);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Connectez-vous pour ajouter des favoris." }, { status: 401 });
  }

  const { propertyId } = await request.json();
  if (!propertyId) {
    return NextResponse.json({ error: "propertyId requis" }, { status: 400 });
  }

  const existing = await prisma.favorite.findUnique({
    where: { userId_propertyId: { userId: session.user.id, propertyId } },
  });

  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
    return NextResponse.json({ favorited: false });
  }

  await prisma.favorite.create({ data: { userId: session.user.id, propertyId } });
  return NextResponse.json({ favorited: true });
}
