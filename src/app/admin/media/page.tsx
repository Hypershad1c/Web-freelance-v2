import Image from "next/image";
import { ImageOff } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { MediaLibraryUploadButton } from "@/components/admin/MediaLibraryUploadButton";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { deleteMedia } from "@/lib/actions/media";
import { isCloudinaryConfigured } from "@/lib/cloudinary";

export default async function AdminMediaPage() {
  const media = await prisma.media.findMany({
    orderBy: { createdAt: "desc" },
    include: { property: { select: { title: true } } },
  });

  return (
    <>
      <AdminTopbar title="Médiathèque" />
      <div className="p-6 lg:p-10">
        {!isCloudinaryConfigured() && (
          <div className="mb-6 rounded-xl bg-domify-warm-white p-4 text-sm text-domify-dark">
            Cloudinary n&apos;est pas configuré — ajoutez <code>CLOUDINARY_CLOUD_NAME</code>,{" "}
            <code>CLOUDINARY_API_KEY</code> et <code>CLOUDINARY_API_SECRET</code> dans <code>.env</code> pour activer
            l&apos;upload direct. En attendant, vous pouvez toujours coller des URLs d&apos;images dans le formulaire
            d&apos;une propriété.
          </div>
        )}

        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm text-domify-dark/60">{media.length} fichier(s)</p>
          <MediaLibraryUploadButton />
        </div>

        {media.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl bg-domify-warm-white p-16 text-center">
            <ImageOff className="text-domify-dark/30" size={36} />
            <p className="mt-4 text-domify-dark/60">Aucun fichier pour le moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {media.map((m) => (
              <div key={m.id} className="group relative overflow-hidden rounded-xl bg-white shadow-luxury">
                <div className="relative aspect-square">
                  <Image src={m.url} alt={m.alt ?? ""} fill className="object-cover" unoptimized />
                  <div className="absolute inset-0 flex items-center justify-center bg-domify-dark/0 transition-luxury group-hover:bg-domify-dark/40">
                    <div className="opacity-0 transition-luxury group-hover:opacity-100">
                      <DeleteButton action={deleteMedia.bind(null, m.id)} confirmLabel="Supprimer ce fichier ?" />
                    </div>
                  </div>
                </div>
                {m.property && (
                  <p className="truncate px-2 py-1.5 text-[11px] text-domify-dark/50">{m.property.title}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
