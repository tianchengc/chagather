import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    background_color: "#09090b",
    description:
      "Voice-first Gongfu tea guidance with Gemini Live native audio + vision, optimized for mobile installability.",
    display: "standalone",
    icons: [
      {
        sizes: "192x192",
        src: "/logo.png",
        type: "image/png",
      },
      {
        sizes: "512x512",
        src: "/logo.png",
        type: "image/png",
      },
      {
        sizes: "any",
        src: "/favicon.png",
        type: "image/png",
      },
    ],
    name: "ChaGather",
    orientation: "portrait",
    short_name: "ChaGather",
    start_url: "/",
    theme_color: "#09090b",
  };
}
