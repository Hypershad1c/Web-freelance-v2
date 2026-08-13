import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendEmail, emailLayout } from "@/lib/email";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

const ForgotPasswordSchema = z.object({ email: z.string().email() });

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

export async function POST(request: Request) {
  const ip = getClientIp(request);
  // Tighter than the other forms — this endpoint is a natural target for
  // enumerating which emails have accounts or for spamming reset emails at someone.
  const { allowed } = rateLimit(`forgot-password:${ip}`, { limit: 5, windowMs: 15 * 60 * 1000 });
  if (!allowed) {
    return NextResponse.json({ ok: true }); // same response either way — see note below
  }

  const body = await request.json().catch(() => null);
  const parsed = ForgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Email invalide" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });

  // Always return success regardless of whether the account exists — this
  // deliberately avoids leaking which emails have accounts (user enumeration).
  if (!user) {
    return NextResponse.json({ ok: true });
  }

  // A Google-only account may not yet have a credentials password. Sending a
  // reset link is safe because the recipient must prove control of the mailbox
  // before a password can be established.

  // Clear any previous outstanding tokens for this user before issuing a new one.
  await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

  const token = randomBytes(32).toString("hex");
  await prisma.passwordResetToken.create({
    data: { token, userId: user.id, expiresAt: new Date(Date.now() + TOKEN_TTL_MS) },
  });

  const resetUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/reinitialiser-mot-de-passe/${token}`;

  const delivery = await sendEmail({
    to: user.email,
    subject: "Réinitialisez votre mot de passe — Domify",
    html: emailLayout(
      "Réinitialisation de mot de passe",
      `<p>Bonjour ${user.name ?? ""},</p>
       <p>Cliquez sur le lien ci-dessous pour choisir un nouveau mot de passe. Ce lien expire dans 1 heure.</p>
       <p><a href="${resetUrl}" style="display:inline-block; background:#CD9C20; color:white; padding:10px 20px; border-radius:8px; text-decoration:none; margin-top:8px;">Réinitialiser mon mot de passe</a></p>
       <p style="margin-top:16px; font-size:12px; color:#1F293766;">Si vous n'êtes pas à l'origine de cette demande, ignorez simplement cet email.</p>`
    ),
  });

  if (delivery.skipped) {
    // Keep the public response indistinguishable to prevent account enumeration,
    // but leave a structured server-side signal for production diagnostics.
    console.error("[auth] Password-reset email was not accepted by the mail provider", {
      reason: delivery.reason,
      userId: user.id,
    });
  }

  return NextResponse.json({ ok: true });
}
