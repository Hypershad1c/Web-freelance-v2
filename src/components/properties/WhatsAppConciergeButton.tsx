"use client";

import { useState } from "react";
import { LoaderCircle, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";

type WhatsAppConciergeButtonProps = {
  propertyId: string;
  placement: "card" | "detail";
  variant?: "compact" | "prominent";
  className?: string;
};

export function WhatsAppConciergeButton({
  propertyId,
  placement,
  variant = "compact",
  className,
}: WhatsAppConciergeButtonProps) {
  const [opening, setOpening] = useState(false);

  async function openConcierge(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    if (opening) return;

    setOpening(true);
    const chatWindow = window.open("about:blank", "_blank");
    if (chatWindow) chatWindow.opener = null;

    try {
      const response = await fetch("/api/concierge/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId, placement }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.url) {
        throw new Error(payload?.error || "WhatsApp indisponible");
      }

      if (chatWindow) {
        chatWindow.location.href = payload.url;
      } else {
        window.location.href = payload.url;
      }
    } catch {
      chatWindow?.close();
      window.alert("Le concierge WhatsApp est momentanément indisponible. Merci de réessayer.");
    } finally {
      setOpening(false);
    }
  }

  const prominent = variant === "prominent";

  return (
    <button
      type="button"
      onClick={openConcierge}
      disabled={opening}
      aria-label="Parler au concierge Domify sur WhatsApp"
      className={cn(
        "pressable inline-flex items-center justify-center gap-2 font-semibold transition-all disabled:cursor-wait disabled:opacity-70",
        prominent
          ? "rounded-xl bg-[#25D366] px-4 py-3 text-sm text-white shadow-[0_18px_30px_-18px_rgba(37,211,102,0.9)] hover:-translate-y-0.5 hover:bg-[#128C4A]"
          : "rounded-xl bg-[#25D366]/10 px-3 py-2.5 text-xs text-[#128C4A] hover:-translate-y-0.5 hover:bg-[#25D366] hover:text-white",
        className
      )}
    >
      {opening ? <LoaderCircle size={prominent ? 17 : 14} className="animate-spin" /> : <WhatsAppIcon size={prominent ? 17 : 14} />}
      <span>{opening ? "Ouverture..." : prominent ? "Parler au concierge" : "WhatsApp"}</span>
      {prominent && <MessageCircle size={15} />}
    </button>
  );
}
