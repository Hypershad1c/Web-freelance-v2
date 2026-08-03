import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

const ResetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
});

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const { allowed } = rateLimit(`reset-password:${ip}`, { limit: 10, windowMs: 15 * 60 * 1000 });
  if (!allowed) {
    return NextResponse.json({ error: "Trop de tentatives. Merci de réessayer plus tard." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = ResetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const resetToken = await prisma.passwordResetToken.findUnique({ where: { token: parsed.data.token } });

  if (!resetToken || resetToken.expiresAt < new Date()) {
    if (resetToken) await prisma.passwordResetToken.delete({ where: { id: resetToken.id } });
    return NextResponse.json({ error: "Ce lien est invalide ou a expiré. Faites une nouvelle demande." }, { status: 400 });
  }

  const hashed = await bcrypt.hash(parsed.data.password, 12);

  await prisma.user.update({ where: { id: resetToken.userId }, data: { password: hashed } });
  await prisma.passwordResetToken.deleteMany({ where: { userId: resetToken.userId } });

  return NextResponse.json({ ok: true });
}
