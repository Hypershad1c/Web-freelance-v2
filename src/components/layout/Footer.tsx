import Link from "next/link";
import { Building2, Globe, Camera, Users, Video, Phone, Mail, MapPin } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-domify-primary-dark text-white/80">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 py-16 sm:px-6 lg:grid-cols-4 lg:px-8">
        <div>
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-domify-gold text-white">
              <Building2 size={18} />
            </span>
            <span className="font-display text-xl font-semibold text-white">DOMIFY</span>
          </Link>
          <p className="mt-4 text-sm leading-relaxed text-white/60">
            Find Your Perfect Place. Votre partenaire immobilier de confiance au Maroc.
          </p>
          <div className="mt-5 flex gap-3">
            {[Globe, Camera, Users, Video].map((Icon, i) => (
              <span key={i} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 transition-luxury hover:bg-domify-gold">
                <Icon size={16} />
              </span>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-display text-base font-semibold text-white">Navigation</h4>
          <ul className="mt-4 space-y-2 text-sm">
            {["Acheter", "Louer", "Projets", "Agences", "Blog", "Contact"].map((l) => (
              <li key={l}><Link href="#" className="hover:text-domify-soft-gold transition-luxury">{l}</Link></li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-display text-base font-semibold text-white">Liens utiles</h4>
          <ul className="mt-4 space-y-2 text-sm">
            {["Estimer mon bien", "Devenir partenaire", "FAQ", "Conditions générales", "Politique de confidentialité"].map((l) => (
              <li key={l}><Link href="#" className="hover:text-domify-soft-gold transition-luxury">{l}</Link></li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-display text-base font-semibold text-white">Contact</h4>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex items-center gap-2"><Phone size={15} /> +212 6 00 00 00 00</li>
            <li className="flex items-center gap-2"><Mail size={15} /> contact@domify.ma</li>
            <li className="flex items-center gap-2"><MapPin size={15} /> 123, Bd Mohammed V, Casablanca, Maroc</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-6 text-center text-xs text-white/50">
        © {new Date().getFullYear()} Domify. Tous droits réservés.
      </div>
    </footer>
  );
}
