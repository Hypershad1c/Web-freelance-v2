import { Star } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { InlineCreateForm } from "@/components/admin/InlineCreateForm";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { PublishToggleButton } from "@/components/admin/PublishToggleButton";
import { createTestimonial, toggleTestimonialPublished, deleteTestimonial } from "@/lib/actions/testimonials";

export default async function AdminTestimonialsPage() {
  const testimonials = await prisma.testimonial.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <>
      <AdminTopbar title="Témoignages" />
      <div className="space-y-6 p-6 lg:p-10">
        <InlineCreateForm action={createTestimonial} submitLabel="Ajouter le témoignage">
          <input name="name" placeholder="Nom (ex. Sara, Casablanca)" required className="input" />
          <input name="city" placeholder="Ville (optionnel)" className="input" />
          <select name="rating" defaultValue="5" className="input">
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>{n} étoiles</option>
            ))}
          </select>
          <input name="photo" placeholder="Photo URL (optionnel)" className="input" />
          <textarea name="quote" placeholder="Le témoignage..." required rows={2} className="input sm:col-span-2 lg:col-span-4" />
          <label className="flex items-center gap-2 text-sm sm:col-span-2 lg:col-span-4">
            <input type="checkbox" name="published" defaultChecked className="h-4 w-4" /> Publié (visible sur le site)
          </label>
        </InlineCreateForm>

        <div className="overflow-hidden rounded-2xl bg-white shadow-luxury">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-black/5 bg-domify-warm-white/50 text-xs uppercase tracking-wide text-domify-dark/50">
              <tr>
                <th className="px-5 py-3 font-medium">Témoignage</th>
                <th className="px-5 py-3 font-medium">Note</th>
                <th className="px-5 py-3 font-medium">Statut</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {testimonials.length === 0 ? (
                <tr><td colSpan={4} className="px-5 py-10 text-center text-domify-dark/50">Aucun témoignage.</td></tr>
              ) : testimonials.map((t) => (
                <tr key={t.id} className="align-top hover:bg-domify-warm-white/30">
                  <td className="max-w-md px-5 py-3">
                    <p className="font-medium text-domify-dark">{t.name}{t.city ? `, ${t.city}` : ""}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-domify-dark/60">{t.quote}</p>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} size={12} className={i < t.rating ? "fill-domify-gold text-domify-gold" : "text-domify-dark/20"} />
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-xs font-medium text-domify-dark/60">
                    {t.published ? "Publié" : "Masqué"}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <PublishToggleButton published={t.published} action={toggleTestimonialPublished.bind(null, t.id)} />
                      <DeleteButton action={deleteTestimonial.bind(null, t.id)} confirmLabel={`Supprimer le témoignage de ${t.name} ?`} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        .input { width: 100%; border-radius: 0.75rem; border: 1px solid rgba(31,41,55,0.12); padding: 0.65rem 0.9rem; font-size: 0.875rem; background: white; }
      `}</style>
    </>
  );
}
