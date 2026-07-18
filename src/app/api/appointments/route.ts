import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

const AppointmentSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  date: z.string(),
  notes: z.string().optional(),
  propertyId: z.string().optional(),
  agentId: z.string().optional(),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = AppointmentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const session = await auth();
  const { date, ...rest } = parsed.data;

  const appointment = await prisma.appointment.create({
    data: {
      ...rest,
      date: new Date(date),
      userId: session?.user?.id,
    },
  });

  return NextResponse.json(appointment, { status: 201 });
}
