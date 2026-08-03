import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isCloudinaryConfigured, signCloudinaryUpload } from "@/lib/cloudinary";

export async function POST() {
  const session = await auth();
  const role = session?.user?.role;
  if (!session || (role !== "ADMIN" && role !== "EDITOR")) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  if (!isCloudinaryConfigured()) {
    return NextResponse.json(
      { error: "Cloudinary n'est pas configuré (CLOUDINARY_CLOUD_NAME / API_KEY / API_SECRET manquants dans .env)." },
      { status: 501 }
    );
  }

  const timestamp = Math.round(Date.now() / 1000);
  const folder = "domify";
  const signature = signCloudinaryUpload({ timestamp, folder });

  return NextResponse.json({
    signature,
    timestamp,
    folder,
    apiKey: process.env.CLOUDINARY_API_KEY,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
  });
}
