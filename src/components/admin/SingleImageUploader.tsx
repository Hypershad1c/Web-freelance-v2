"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Upload, X, Loader2 } from "lucide-react";

export function SingleImageUploader({ name, defaultUrl }: { name: string; defaultUrl?: string }) {
  const [url, setUrl] = useState(defaultUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualUrl, setManualUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFile(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);

    try {
      const signRes = await fetch("/api/cloudinary/sign", { method: "POST" });
      const signData = await signRes.json();
      if (!signRes.ok) {
        setError(signData.error || "Upload indisponible. Collez une URL manuellement.");
        setUploading(false);
        return;
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

      setUrl(uploadData.secure_url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Échec de l'upload.");
    }
    setUploading(false);
  }

  return (
    <div>
      {url ? (
        <div className="relative h-40 w-full max-w-sm overflow-hidden rounded-xl bg-domify-warm-white">
          <Image src={url} alt="" fill className="object-cover" unoptimized />
          <button
            type="button"
            onClick={() => setUrl("")}
            className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-domify-dark/70 text-white"
            aria-label="Retirer"
          >
            <X size={13} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex h-32 w-full max-w-sm flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-domify-primary/30 text-domify-primary/70 transition-luxury hover:border-domify-primary hover:text-domify-primary disabled:opacity-60"
        >
          {uploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
          <span className="text-xs font-medium">{uploading ? "Upload en cours..." : "Ajouter une image"}</span>
        </button>
      )}

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files)} />

      {error && <p className="mt-2 text-xs text-domify-dark/60">{error}</p>}

      {!url && (
        <div className="mt-2 flex max-w-sm gap-2">
          <input
            value={manualUrl}
            onChange={(e) => setManualUrl(e.target.value)}
            placeholder="Ou collez une URL..."
            className="flex-1 rounded-lg border border-black/10 px-3 py-2 text-xs"
          />
          <button
            type="button"
            onClick={() => {
              if (manualUrl.trim()) setUrl(manualUrl.trim());
              setManualUrl("");
            }}
            className="rounded-lg border border-black/10 px-3 py-2 text-xs font-medium text-domify-dark/70 hover:bg-domify-warm-white"
          >
            OK
          </button>
        </div>
      )}

      <input type="hidden" name={name} value={url} />
    </div>
  );
}
