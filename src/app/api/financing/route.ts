import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { verifyTurnstile } from "@/lib/turnstile";
import { upsertCrmContact } from "@/lib/crm";

const FinancingSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().max(180),
  phone: z.string().max(40).optional(),
  monthlyIncome: z.coerce.number().int().min(0).max(10_000_000).optional(),
  monthlyDebt: z.coerce.number().int().min(0).max(10_000_000).optional(),
  savings: z.coerce.number().int().min(0).max(100_000_000).optional(),
  estimatedBudget: z.coerce.number().int().min(0).max(100_000_000).optional(),
  downPayment: z.coerce.number().int().min(0).max(100_000_000).optional(),
  employmentType: z.string().max(120).optional(),
  preferredBank: z.string().max(120).optional(),
  bankPreApproved: z.boolean().optional(),
  notes: z.string().max(3000).optional(),
  consent: z.literal(true),
  source: z.string().max(100).optional(),
  utmSource: z.string().max(160).optional(),
  utmMedium: z.string().max(160).optional(),
  utmCampaign: z.string().max(240).optional(),
  website: z.string().optional(),
  turnstileToken: z.string().optional(),
});

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const { allowed } = rateLimit(`financing:${ip}`, { limit: 3, windowMs: 10 * 60 * 1000 });
  if (!allowed) return NextResponse.json({ error: "Trop de demandes. Merci de réessayer plus tard." }, { status: 429 });
  const parsed = FinancingSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  if (parsed.data.website) return NextResponse.json({ ok: true }, { status: 201 });
  const verification = await verifyTurnstile({ token: parsed.data.turnstileToken, remoteIp: ip, expectedAction: "financing" });
  if (!verification.ok) return NextResponse.json({ error: "La vérification de sécurité a échoué. Merci de réessayer." }, { status: 400 });

  const { website, turnstileToken, consent, name, email, phone, source, utmSource, utmMedium, utmCampaign, ...profileData } = parsed.data;
  void website; void turnstileToken; void consent;
  const session = await auth();
  const contact = await upsertCrmContact({ name, email, phone: phone || null, source: source || "financing_readiness" });
  const [profile] = await prisma.$transaction([
    prisma.financingProfile.create({ data: { ...profileData, contactId: contact.id, userId: session?.user?.id, consent: true } }),
    prisma.lead.create({ data: { name, email, phone: phone || null, source: source || "financing_readiness", utmSource: utmSource || null, utmMedium: utmMedium || null, utmCampaign: utmCampaign || null, userId: session?.user?.id, crmContactId: contact.id, message: "Demande de qualification financière. À examiner avec le client." } }),
    prisma.analyticsEvent.create({ data: { type: "lead", path: "/financement", source: utmSource || source || "direct", medium: utmMedium || null, campaign: utmCampaign || null, meta: { kind: "financing_readiness" } } }),
  ]);
  return NextResponse.json({ ok: true, profileId: profile.id }, { status: 201 });
}
