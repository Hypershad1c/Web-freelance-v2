import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isCloudinaryConfigured, signCloudinaryUpload } from "@/lib/cloudinary";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Connexion requise" }, { status: 401 });

  if (!isCloudinaryConfigured()) {
    return NextResponse.json({ error: "Le téléversement est temporairement indisponible." }, { status: 501 });
  }

  const timestamp = Math.round(Date.now() / 1000);
  const folder = `domify/seller/${session.user.id}`;
  const signature = signCloudinaryUpload({ timestamp, folder });

  return NextResponse.json({
    signature,
    timestamp,
    folder,
    apiKey: process.env.CLOUDINARY_API_KEY,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
  });
}
