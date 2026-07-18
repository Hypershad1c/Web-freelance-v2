"use client";

import Image from "next/image";
import { useState } from "react";

export function PropertyGallery({ images, title }: { images: string[]; title: string }) {
  const [active, setActive] = useState(0);

  return (
    <div>
      <div className="relative h-[320px] w-full overflow-hidden rounded-2xl sm:h-[460px]">
        <Image src={images[active]} alt={title} fill priority className="object-cover" />
      </div>
      {images.length > 1 && (
        <div className="mt-3 grid grid-cols-4 gap-3">
          {images.map((img, i) => (
            <button
              key={img}
              onClick={() => setActive(i)}
              className={`relative h-20 overflow-hidden rounded-xl transition-luxury ${
                active === i ? "ring-2 ring-domify-gold" : "opacity-70 hover:opacity-100"
              }`}
            >
              <Image src={img} alt={`${title} ${i + 1}`} fill className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
