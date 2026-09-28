import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "NutriPing — Personalized Diet Planner",
    short_name: "NutriPing",
    description:
      "Personalized Indian diet plans, calorie & macro tracking, and daily WhatsApp reminders.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#fbf6ef",
    theme_color: "#f4703a",
    orientation: "portrait",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
