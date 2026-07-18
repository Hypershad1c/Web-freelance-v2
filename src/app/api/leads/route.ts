import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

const LeadSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  message: z.string().optional(),
  propertyId: z.string().optional(),
  source: z.string().optional(),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = LeadSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const session = await auth();

  const lead = await prisma.lead.create({
    data: {
      ...parsed.data,
      userId: session?.user?.id,
    },
  });

  return NextResponse.json(lead, { status: 201 });
}
