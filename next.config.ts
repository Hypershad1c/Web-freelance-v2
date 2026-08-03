import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Produces a self-contained .next/standalone build (only the files needed to
  // run in production) — required by the Dockerfile in this repo. Doesn't affect
  // `next dev` or a standard Vercel deployment.
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
  async headers() {
    // CSP built from an actual audit of every external resource this app uses
    // (grepped the codebase rather than guessing) — see README for the full list
    // and how to re-verify it if you add new external resources later.
    const csp = [
      "default-src 'self'",
      // Next.js injects inline hydration/runtime scripts; a stricter nonce-based
      // policy is possible but needs additional middleware wiring — not done here.
      "script-src 'self' 'unsafe-inline'",
      // Google Fonts stylesheet + a few components use inline <style> blocks.
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      // Admins can paste arbitrary image URLs in the media uploader (not just
      // Cloudinary/Unsplash), so this stays broad rather than enumerating hosts —
      // image loading isn't a script-execution vector the way script-src is.
      "img-src 'self' https: data: blob:",
      // Cloudinary direct-upload (client-side fetch) + same-origin API routes.
      "connect-src 'self' https://api.cloudinary.com",
      "frame-ancestors 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; ");

    return [
      {
        // Applies to every route — baseline hardening, not a replacement for the
        // app-level protections (rate limiting, Zod validation, auth checks) above.
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" }, // blocks clickjacking via iframe embedding
          { key: "X-Content-Type-Options", value: "nosniff" }, // stops MIME-sniffing attacks
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Content-Security-Policy", value: csp },
        ],
      },
    ];
  },
};

export default nextConfig;
