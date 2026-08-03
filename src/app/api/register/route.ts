import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendEmail, emailLayout } from "@/lib/email";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

const RegisterSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Email invalide"),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
  phone: z.string().optional(),
});

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const { allowed } = rateLimit(`register:${ip}`, { limit: 5, windowMs: 60 * 60 * 1000 });
  if (!allowed) {
    return NextResponse.json({ error: "Trop de tentatives. Merci de réessayer plus tard." }, { status: 429 });
  }

  const body = await request.json();
  const parsed = RegisterSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { name, email, password, phone } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Un compte existe déjà avec cet email." }, { status: 409 });
  }

  const hashed = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: { name, email, password: hashed, phone, role: "USER" },
  });

  sendEmail({
    to: user.email,
    subject: "Bienvenue sur Domify !",
    html: emailLayout(
      "Bienvenue sur Domify",
      `<p>Bonjour ${name},</p>
       <p>Votre compte a bien été créé. Vous pouvez désormais sauvegarder vos biens favoris, suivre vos demandes de visite et contacter directement nos agents.</p>`
    ),
  }).catch((e) => console.error("[register] welcome email failed:", e));

  return NextResponse.json({ id: user.id, email: user.email }, { status: 201 });
}
