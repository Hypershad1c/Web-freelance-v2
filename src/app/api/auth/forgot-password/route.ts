import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendEmail, emailLayout } from "@/lib/email";

const Schema = z.object({ email: z.string().email() });

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { email } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });

  // Always return the same response whether or not the account exists —
  // don't leak which emails have accounts on the site.
  if (user) {
    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.passwordResetToken.create({
      data: { token, userId: user.id, expiresAt },
    });

    const resetUrl = `${process.env.NEXTAUTH_URL}/reinitialiser-mot-de-passe/${token}`;

    sendEmail({
      to: email,
      subject: "Réinitialisation de votre mot de passe — Domify",
      html: emailLayout(
        "Réinitialiser votre mot de passe",
        `<p>Bonjour ${user.name ?? ""},</p>
         <p>Vous avez demandé à réinitialiser votre mot de passe. Ce lien est valable une heure :</p>
         <p><a href="${resetUrl}" style="display:inline-block; background:#C9A227; color:#fff; padding:10px 20px; border-radius:8px; text-decoration:none; font-weight:600;">Réinitialiser mon mot de passe</a></p>
         <p style="color:#9CA3AF; font-size:12px;">Si vous n'êtes pas à l'origine de cette demande, ignorez simplement cet email.</p>`
      ),
    }).catch((e) => console.error("[forgot-password] email failed:", e));
  }

  return NextResponse.json({ ok: true });
}
