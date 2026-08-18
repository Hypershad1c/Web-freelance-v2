"use client";

import { MessageCircle, Phone } from "lucide-react";
import { PropertyActionButtons } from "@/components/properties/PropertyActionButtons";
import { WhatsAppConciergeButton } from "@/components/properties/WhatsAppConciergeButton";
import { telLink } from "@/lib/utils";

export function MobilePropertyActionBar({ propertyId, phone }: { propertyId: string; phone?: string | null }) {
  const scrollToContact = () => document.getElementById("contact-property")?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-domify-dark/10 bg-white/92 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-18px_42px_-30px_rgba(16,47,66,0.55)] backdrop-blur-xl lg:hidden">
      <div className="mx-auto flex max-w-xl items-center gap-2">
        <div className="flex shrink-0 gap-1.5"><PropertyActionButtons propertyId={propertyId} /></div>
        <WhatsAppConciergeButton propertyId={propertyId} placement="detail" variant="prominent" className="min-h-11 flex-1 px-3" />
        {phone ? (
          <a href={telLink(phone)} className="pressable flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-domify-primary/15 bg-domify-primary/8 text-domify-primary hover:bg-domify-primary hover:text-white" aria-label="Appeler l’agence"><Phone size={17} /></a>
        ) : (
          <button type="button" onClick={scrollToContact} className="pressable flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-domify-primary/15 bg-domify-primary/8 text-domify-primary hover:bg-domify-primary hover:text-white" aria-label="Contacter l’agence"><MessageCircle size={17} /></button>
        )}
      </div>
    </div>
  );
}
