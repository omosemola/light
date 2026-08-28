import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Lightson Marketplace",
    short_name: "Lightson",
    description: "A premium, modern, mobile-first campus marketplace.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#1E1B4B",
    theme_color: "#1E1B4B",
    icons: [
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
