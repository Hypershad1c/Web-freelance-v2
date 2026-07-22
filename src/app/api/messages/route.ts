import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { sendEmail, emailLayout } from "@/lib/email";
import { getSiteSettings } from "@/lib/data/settings";

const MessageSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  subject: z.string().optional(),
  body: z.string().min(5),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = MessageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const session = await auth();
  const message = await prisma.message.create({
    data: { ...parsed.data, userId: session?.user?.id },
  });

  notifyNewMessage(message).catch((e) => console.error("[messages] notification failed:", e));

  return NextResponse.json(message, { status: 201 });
}

async function notifyNewMessage(message: { name: string; email: string; subject: string | null; body: string }) {
  const settings = await getSiteSettings();

  await sendEmail({
    to: settings.contact_email,
    subject: `Nouveau message — ${message.subject || "sans sujet"}`,
    html: emailLayout(
      "Nouveau message de contact",
      `<p><strong>${message.name}</strong> (${message.email}) :</p>
       <p style="background:#F2ECDD; padding:12px 16px; border-radius:8px;">${message.body}</p>`
    ),
  });
}
