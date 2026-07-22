"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

async function requireAdmin() {
  const session = await auth();
  const role = session?.user?.role;
  if (!session || role !== "ADMIN") {
    // Only full Admins manage users/roles — Editors can manage content but not accounts.
    throw new Error("Non autorisé — réservé aux administrateurs.");
  }
  return session;
}

export type SimpleFormState = { message?: string; errors?: Record<string, string[]> };

const RoleEnum = z.enum(["ADMIN", "EDITOR", "AGENT", "USER"]);

const CreateUserSchema = z.object({
  name: z.string().min(2, "Nom requis"),
  email: z.string().email("Email invalide"),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
  phone: z.string().optional(),
  role: RoleEnum,
});

export async function createUser(_prev: SimpleFormState, formData: FormData): Promise<SimpleFormState> {
  await requireAdmin();
  const parsed = CreateUserSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    phone: formData.get("phone") || undefined,
    role: formData.get("role"),
  });
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) return { message: "Un compte existe déjà avec cet email." };

  const hashed = await bcrypt.hash(parsed.data.password, 12);
  const user = await prisma.user.create({
    data: { ...parsed.data, password: hashed },
  });

  revalidatePath("/admin/users");
  redirect(`/admin/users/${user.id}`);
}

const UpdateUserSchema = z.object({
  name: z.string().min(2, "Nom requis"),
  email: z.string().email("Email invalide"),
  phone: z.string().optional(),
  role: RoleEnum,
  password: z.string().min(8, "8 caractères minimum").optional().or(z.literal("")),
});

export async function updateUser(id: string, _prev: SimpleFormState, formData: FormData): Promise<SimpleFormState> {
  const session = await requireAdmin();
  const parsed = UpdateUserSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone") || undefined,
    role: formData.get("role"),
    password: formData.get("password") || undefined,
  });
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };

  if (session.user.id === id && parsed.data.role !== "ADMIN") {
    return { message: "Vous ne pouvez pas retirer votre propre rôle Admin." };
  }

  const { password, ...rest } = parsed.data;
  await prisma.user.update({
    where: { id },
    data: {
      ...rest,
      ...(password ? { password: await bcrypt.hash(password, 12) } : {}),
    },
  });

  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${id}`);
  return { message: "Utilisateur mis à jour." };
}

export async function deleteUser(id: string) {
  const session = await requireAdmin();
  if (session.user.id === id) {
    throw new Error("Vous ne pouvez pas supprimer votre propre compte.");
  }
  await prisma.user.delete({ where: { id } });
  revalidatePath("/admin/users");
}

// Lightweight version for the inline role dropdown on the users list page
// (StatusSelect just calls action(value) — doesn't go through useActionState/FormData).
export async function updateUserRole(id: string, role: string) {
  const session = await requireAdmin();
  const parsed = RoleEnum.safeParse(role);
  if (!parsed.success) throw new Error("Rôle invalide");

  if (session.user.id === id && parsed.data !== "ADMIN") {
    throw new Error("Vous ne pouvez pas retirer votre propre rôle Admin.");
  }

  await prisma.user.update({ where: { id }, data: { role: parsed.data } });
  revalidatePath("/admin/users");
}

// ---------- Permission assignment ----------

export async function togglePermission(userId: string, permissionId: string, grant: boolean) {
  await requireAdmin();
  if (grant) {
    await prisma.userPermission.upsert({
      where: { userId_permissionId: { userId, permissionId } },
      update: {},
      create: { userId, permissionId },
    });
  } else {
    await prisma.userPermission.deleteMany({ where: { userId, permissionId } });
  }
  revalidatePath(`/admin/users/${userId}`);
}
