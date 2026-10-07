import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "BTS2 CV-A Gestion",
    short_name: "BTS2 CV-A",
    description: "ESMA • 2A BTS Communication Visuelle • Groupe A • 2026-2027",
    lang: "fr",
    dir: "ltr",
    start_url: "/",
    scope: "/",
    display: "standalone",
    display_override: ["window-controls-overlay", "standalone", "minimal-ui"],
    orientation: "any",
    background_color: "#FFF6EE",
    theme_color: "#FF7A00",
    categories: ["education", "productivity"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Nouvelle évaluation", url: "/evaluations?new=1", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
      { name: "Participations", url: "/participations", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
      { name: "Documents & Ventes", url: "/documents", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
