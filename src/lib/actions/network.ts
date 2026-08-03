"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { slugify } from "@/lib/utils";

async function requireAdmin() {
  const session = await auth();
  const role = session?.user?.role;
  if (!session || (role !== "ADMIN" && role !== "EDITOR")) {
    throw new Error("Non autorisé");
  }
}

export type SimpleFormState = { message?: string; errors?: Record<string, string[]> };

const AgencySchema = z.object({
  name: z.string().min(2, "Nom requis"),
  slug: z.string().min(2, "Slug requis"),
  description: z.string().optional(),
  logo: z.string().optional(),
  coverImage: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  address: z.string().optional(),
  verified: z.coerce.boolean().default(false),
});

function parseAgencyForm(formData: FormData) {
  const name = String(formData.get("name") ?? "");
  const rawSlug = String(formData.get("slug") ?? "");
  return {
    name,
    slug: slugify(rawSlug || name),
    description: formData.get("description") || undefined,
    logo: formData.get("logo") || undefined,
    coverImage: formData.get("coverImage") || undefined,
    phone: formData.get("phone") || undefined,
    email: formData.get("email") || undefined,
    address: formData.get("address") || undefined,
    verified: formData.get("verified") === "on",
  };
}

export async function createAgency(_prev: SimpleFormState, formData: FormData): Promise<SimpleFormState> {
  await requireAdmin();
  const parsed = AgencySchema.safeParse(parseAgencyForm(formData));
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };

  let agency;
  try {
    agency = await prisma.agency.create({ data: parsed.data });
  } catch (e) {
    if (e instanceof Error && e.message.includes("Unique constraint")) {
      return { message: "Une agence avec ce slug existe déjà." };
    }
    throw e;
  }
  revalidatePath("/admin/agencies");
  revalidatePath("/agences");
  redirect(`/admin/agencies/${agency.id}`);
}

export async function updateAgency(id: string, _prev: SimpleFormState, formData: FormData): Promise<SimpleFormState> {
  await requireAdmin();
  const parsed = AgencySchema.safeParse(parseAgencyForm(formData));
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };

  await prisma.agency.update({ where: { id }, data: parsed.data });
  revalidatePath("/admin/agencies");
  revalidatePath(`/agences/${parsed.data.slug}`);
  return { message: "Agence mise à jour." };
}

export async function deleteAgency(id: string) {
  await requireAdmin();
  await prisma.agency.delete({ where: { id } });
  revalidatePath("/admin/agencies");
  revalidatePath("/agences");
}

const AgentSchema = z.object({
  name: z.string().min(2, "Nom requis"),
  slug: z.string().min(2, "Slug requis"),
  bio: z.string().optional(),
  photo: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  agencyId: z.string().optional(),
});

function parseAgentForm(formData: FormData) {
  const name = String(formData.get("name") ?? "");
  const rawSlug = String(formData.get("slug") ?? "");
  return {
    name,
    slug: slugify(rawSlug || name),
    bio: formData.get("bio") || undefined,
    photo: formData.get("photo") || undefined,
    phone: formData.get("phone") || undefined,
    email: formData.get("email") || undefined,
    agencyId: formData.get("agencyId") || undefined,
  };
}

export async function createAgent(_prev: SimpleFormState, formData: FormData): Promise<SimpleFormState> {
  await requireAdmin();
  const parsed = AgentSchema.safeParse(parseAgentForm(formData));
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };

  let agent;
  try {
    agent = await prisma.agent.create({ data: { ...parsed.data, agencyId: parsed.data.agencyId || null } });
  } catch (e) {
    if (e instanceof Error && e.message.includes("Unique constraint")) {
      return { message: "Un agent avec ce slug existe déjà." };
    }
    throw e;
  }
  revalidatePath("/admin/agents");
  redirect(`/admin/agents/${agent.id}`);
}

export async function updateAgent(id: string, _prev: SimpleFormState, formData: FormData): Promise<SimpleFormState> {
  await requireAdmin();
  const parsed = AgentSchema.safeParse(parseAgentForm(formData));
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };

  await prisma.agent.update({ where: { id }, data: { ...parsed.data, agencyId: parsed.data.agencyId || null } });
  revalidatePath("/admin/agents");
  revalidatePath(`/agents/${parsed.data.slug}`);
  return { message: "Agent mis à jour." };
}

export async function deleteAgent(id: string) {
  await requireAdmin();
  await prisma.agent.delete({ where: { id } });
  revalidatePath("/admin/agents");
}
