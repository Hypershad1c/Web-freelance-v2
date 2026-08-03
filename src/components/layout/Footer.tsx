import Link from "next/link";
import Image from "next/image";
import { Globe, Camera, Users, Phone, Mail, MapPin } from "lucide-react";
import { getSiteSettings } from "@/lib/data/settings";
import type { Locale } from "@/i18n/locales";
import type { Dictionary } from "@/i18n/get-dictionary";

export async function Footer({ dict }: { locale: Locale; dict: Dictionary }) {
  const settings = await getSiteSettings();

  const navLinks = [
    { label: dict.nav.buy, href: "/proprietes?type=vente" },
    { label: dict.nav.rent, href: "/proprietes?type=location" },
    { label: dict.nav.agencies, href: "/agences" },
    { label: dict.nav.blog, href: "/blog" },
    { label: dict.nav.contact, href: "/contact" },
  ];

  const usefulLinks = [
    { label: dict.footer.sellOrRent, href: "/vendre-louer" },
    { label: dict.footer.estimate, href: "/estimation" },
    { label: dict.footer.mapSearch, href: "/carte" },
    { label: dict.footer.compare, href: "/comparer" },
    { label: dict.footer.mortgageCalculator, href: "/calculateur-credit" },
    { label: dict.footer.investmentCalculator, href: "/calculateur-investissement" },
    { label: dict.footer.partner, href: "/contact" },
    { label: dict.footer.faq, href: "/faq" },
    { label: dict.footer.terms, href: "/conditions-generales" },
    { label: dict.footer.privacy, href: "/politique-de-confidentialite" },
  ];

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
          <p className="mt-4 text-sm leading-relaxed text-white/60">{dict.footer.tagline}</p>
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
          <h4 className="font-display text-base font-semibold text-white">{dict.footer.navigation}</h4>
          <ul className="mt-4 space-y-2 text-sm">
            {navLinks.map((l) => (
              <li key={l.label}><Link href={l.href} className="hover:text-domify-soft-gold transition-luxury">{l.label}</Link></li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-display text-base font-semibold text-white">{dict.footer.usefulLinks}</h4>
          <ul className="mt-4 space-y-2 text-sm">
            {usefulLinks.map((l) => (
              <li key={l.label}><Link href={l.href} className="hover:text-domify-soft-gold transition-luxury">{l.label}</Link></li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-display text-base font-semibold text-white">{dict.footer.contact}</h4>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex items-center gap-2"><Phone size={15} /> {settings.contact_phone}</li>
            <li className="flex items-center gap-2"><Mail size={15} /> {settings.contact_email}</li>
            <li className="flex items-center gap-2"><MapPin size={15} /> {settings.contact_address}</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-6 text-center text-xs text-white/50">
        © {new Date().getFullYear()} Domify. {dict.footer.rights}
      </div>
    </footer>
  );
}
