import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BTS2 CV-A Gestion",
    short_name: "BTS2 CV-A",
    start_url: "/",
    display: "standalone",
    background_color: "#FFF6EE",
    theme_color: "#FF7A00",
    icons: [{ src: "/logo-bts2.jpeg", sizes: "512x512", type: "image/jpeg" }],
  };
}
