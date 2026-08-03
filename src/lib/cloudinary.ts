import { createHash } from "crypto";

// Generates a signature for Cloudinary's "signed upload" flow: the browser uploads
// the file directly to Cloudinary (never touches our server), using a short-lived
// signature we generate here with the API secret, which never leaves the server.
// Docs: https://cloudinary.com/documentation/upload_images#generating_authentication_signatures

export function isCloudinaryConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET
  );
}

export function signCloudinaryUpload(paramsToSign: Record<string, string | number>) {
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!apiSecret) throw new Error("CLOUDINARY_API_SECRET is not configured");

  const sorted = Object.keys(paramsToSign)
    .sort()
    .map((key) => `${key}=${paramsToSign[key]}`)
    .join("&");

  return createHash("sha1").update(sorted + apiSecret).digest("hex");
}
