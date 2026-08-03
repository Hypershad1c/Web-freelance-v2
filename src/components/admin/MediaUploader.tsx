"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Upload, X, Link2, Loader2 } from "lucide-react";

type UploadedImage = { url: string; uploading?: boolean };

export function MediaUploader({ name, defaultUrls = [] }: { name: string; defaultUrls?: string[] }) {
  const [images, setImages] = useState<UploadedImage[]>(defaultUrls.map((url) => ({ url })));
  const [error, setError] = useState<string | null>(null);
  const [manualUrl, setManualUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);

    for (const file of Array.from(files)) {
      const placeholder: UploadedImage = { url: URL.createObjectURL(file), uploading: true };
      setImages((prev) => [...prev, placeholder]);

      try {
        const signRes = await fetch("/api/cloudinary/sign", { method: "POST" });
        const signData = await signRes.json();

        if (!signRes.ok) {
          // Cloudinary not configured — remove the placeholder and let the person
          // fall back to pasting a URL directly instead.
          setImages((prev) => prev.filter((img) => img !== placeholder));
          setError(signData.error || "Upload indisponible. Collez une URL d'image manuellement ci-dessous.");
          continue;
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

        setImages((prev) =>
          prev.map((img) => (img === placeholder ? { url: uploadData.secure_url as string } : img))
        );
      } catch (e) {
        setImages((prev) => prev.filter((img) => img !== placeholder));
        setError(e instanceof Error ? e.message : "Échec de l'upload.");
      }
    }
  }

  function addManualUrl() {
    if (!manualUrl.trim()) return;
    setImages((prev) => [...prev, { url: manualUrl.trim() }]);
    setManualUrl("");
  }

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        {images.map((img, i) => (
          <div key={img.url + i} className="group relative aspect-square overflow-hidden rounded-xl bg-domify-warm-white">
            <Image src={img.url} alt="" fill className="object-cover" unoptimized />
            {img.uploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-domify-dark/40">
                <Loader2 className="animate-spin text-white" size={20} />
              </div>
            )}
            {!img.uploading && (
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-domify-dark/70 text-white opacity-0 transition-luxury group-hover:opacity-100"
                aria-label="Retirer"
              >
                <X size={12} />
              </button>
            )}
            {i === 0 && !img.uploading && (
              <span className="absolute bottom-1 left-1 rounded bg-domify-gold px-1.5 py-0.5 text-[10px] font-semibold text-white">
                Principale
              </span>
            )}
          </div>
        ))}

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-domify-primary/30 text-domify-primary/70 transition-luxury hover:border-domify-primary hover:text-domify-primary"
        >
          <Upload size={18} />
          <span className="text-[11px] font-medium">Ajouter</span>
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {error && (
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-domify-warm-white p-3 text-xs text-domify-dark/70">
          <Link2 size={13} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="mt-3 flex gap-2">
        <input
          value={manualUrl}
          onChange={(e) => setManualUrl(e.target.value)}
          placeholder="Ou collez une URL d'image..."
          className="flex-1 rounded-lg border border-black/10 px-3 py-2 text-xs"
        />
        <button
          type="button"
          onClick={addManualUrl}
          className="rounded-lg border border-black/10 px-3 py-2 text-xs font-medium text-domify-dark/70 hover:bg-domify-warm-white"
        >
          Ajouter l&apos;URL
        </button>
      </div>

      {/* Serialized back into the same newline-separated format the server actions
          already parse — keeps this a drop-in replacement for the old plain textarea.
          In-flight uploads (blob: URLs) are excluded until they resolve to a real URL. */}
      <textarea
        name={name}
        value={images
          .filter((i) => !i.uploading)
          .map((i) => i.url)
          .join("\n")}
        readOnly
        hidden
      />
    </div>
  );
}
