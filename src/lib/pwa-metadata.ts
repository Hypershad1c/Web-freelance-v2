import type { Metadata, Viewport } from "next";

export const pwaMetadata: Partial<Metadata> = {
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Domify",
  },
  icons: {
    icon: [
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const pwaViewport: Viewport = {
  themeColor: "#336699",
  width: "device-width",
  initialScale: 1,
  // Lets the app draw under the iPhone notch/home-indicator area instead of
  // leaving black bars — matters specifically for the standalone/installed mode.
  viewportFit: "cover",
};
