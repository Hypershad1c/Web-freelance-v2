"use client";

import dynamic from "next/dynamic";

export const PropertyMapClient = dynamic(() => import("./PropertyMap").then((m) => m.PropertyMap), {
  ssr: false,
  loading: () => (
    <div className="flex h-[400px] items-center justify-center rounded-2xl bg-domify-warm-white text-sm text-domify-dark/50">
      Chargement de la carte...
    </div>
  ),
});
