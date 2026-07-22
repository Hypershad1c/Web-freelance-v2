import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendEmail, emailLayout } from "@/lib/email";

const RegisterSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Email invalide"),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
  phone: z.string().optional(),
});

export async function POST(request: Request) {
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
      `Bienvenue, ${name} !`,
      `<p>Votre compte Domify a bien été créé. Vous pouvez dès maintenant enregistrer vos favoris, suivre vos demandes de visite et vos leads en cours.</p>`
    ),
  }).catch((e) => console.error("[register] welcome email failed:", e));

  return NextResponse.json({ id: user.id, email: user.email }, { status: 201 });
}
