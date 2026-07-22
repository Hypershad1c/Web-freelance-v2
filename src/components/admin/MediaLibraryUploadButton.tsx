"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, Loader2 } from "lucide-react";
import { registerUploadedMedia } from "@/lib/actions/media";

export function MediaLibraryUploadButton() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    setUploading(true);

    for (const file of Array.from(files)) {
      try {
        const signRes = await fetch("/api/cloudinary/sign", { method: "POST" });
        const signData = await signRes.json();
        if (!signRes.ok) {
          setError(signData.error || "Upload indisponible.");
          break;
        }

        const form = new FormData();
        form.append("file", file);
        form.append("api_key", signData.apiKey);
        form.append("timestamp", String(signData.timestamp));
        form.append("signature", signData.signature);
        form.append("folder", signData.folder);

        const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${signData.cloudName}/image/upload`, {
          method: "POST",
          body: form,
        });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error?.message || "Échec de l'upload");

        await registerUploadedMedia({
          url: uploadData.secure_url,
          cloudinaryId: uploadData.public_id,
          alt: file.name,
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Échec de l'upload.");
      }
    }

    setUploading(false);
    router.refresh();
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="flex items-center gap-2 rounded-xl bg-domify-gold px-4 py-2.5 text-sm font-semibold text-white shadow-luxury transition-luxury hover:bg-domify-soft-gold hover:text-domify-dark disabled:opacity-60"
      >
        {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
        {uploading ? "Upload en cours..." : "Uploader des images"}
      </button>
      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
