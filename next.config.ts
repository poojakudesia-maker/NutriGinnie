import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdf-parse (via pdfjs-dist) dynamically imports a worker file at a path
  // Turbopack can't resolve once bundled into .next/dev/server/chunks — keep
  // it as a real Node require so the worker file loads from node_modules.
  serverExternalPackages: ["pdf-parse", "pdfjs-dist", "mammoth"],
};

export default nextConfig;
