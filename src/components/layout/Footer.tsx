import Link from "next/link";
import Image from "next/image";
import { Globe, Camera, Users, Phone, Mail, MapPin } from "lucide-react";
import { getSiteSettings } from "@/lib/data/settings";

export async function Footer() {
  const settings = await getSiteSettings();
  return (
    <footer className="bg-domify-primary-dark text-white/80">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 py-16 sm:px-6 lg:grid-cols-4 lg:px-8">
        <div>
          <Link href="/" className="flex items-center gap-2">
            <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg">
              <Image src="/Logo.jpeg" alt="Domify" fill className="object-cover" />
            </span>
            <span className="font-display text-xl font-semibold text-white">DOMIFY</span>
          </Link>
          <p className="mt-4 text-sm leading-relaxed text-white/60">
            Find Your Perfect Place. Votre partenaire immobilier de confiance au Maroc.
          </p>
          <div className="mt-5 flex gap-3">
            {[
              { Icon: Globe, url: settings.social_facebook },
              { Icon: Camera, url: settings.social_instagram },
              { Icon: Users, url: settings.social_linkedin },
            ]
              .filter((s) => s.url)
              .map(({ Icon, url }, i) => (
                <a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 transition-luxury hover:bg-domify-gold"
                >
                  <Icon size={16} />
                </a>
              ))}
          </div>
        </div>

        <div>
          <h4 className="font-display text-base font-semibold text-white">Navigation</h4>
          <ul className="mt-4 space-y-2 text-sm">
            {[
              { label: "Acheter", href: "/proprietes?type=vente" },
              { label: "Louer", href: "/proprietes?type=location" },
              { label: "Agences", href: "/agences" },
              { label: "Blog", href: "/blog" },
              { label: "Contact", href: "/contact" },
            ].map((l) => (
              <li key={l.label}><Link href={l.href} className="hover:text-domify-soft-gold transition-luxury">{l.label}</Link></li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-display text-base font-semibold text-white">Liens utiles</h4>
          <ul className="mt-4 space-y-2 text-sm">
            {[
              { label: "Estimer mon bien", href: "/estimation" },
              { label: "Recherche sur la carte", href: "/carte" },
              { label: "Comparer des biens", href: "/comparer" },
              { label: "Calculateur de crédit", href: "/calculateur-credit" },
              { label: "Calculateur d'investissement", href: "/calculateur-investissement" },
              { label: "Devenir partenaire", href: "/contact" },
              { label: "FAQ", href: "/faq" },
              { label: "Conditions générales", href: "/conditions-generales" },
              { label: "Politique de confidentialité", href: "/politique-de-confidentialite" },
            ].map((l) => (
              <li key={l.label}><Link href={l.href} className="hover:text-domify-soft-gold transition-luxury">{l.label}</Link></li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-display text-base font-semibold text-white">Contact</h4>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex items-center gap-2"><Phone size={15} /> {settings.contact_phone}</li>
            <li className="flex items-center gap-2"><Mail size={15} /> {settings.contact_email}</li>
            <li className="flex items-center gap-2"><MapPin size={15} /> {settings.contact_address}</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-6 text-center text-xs text-white/50">
        © {new Date().getFullYear()} Domify. Tous droits réservés.
      </div>
    </footer>
  );
}
