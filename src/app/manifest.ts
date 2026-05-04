import type { MetadataRoute } from "next";
import { appConfig } from "@/lib/app-config";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: appConfig.app.name,
    short_name: appConfig.app.shortName,
    description: appConfig.app.description,
    start_url: appConfig.app.homeHref,
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
