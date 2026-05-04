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
    background_color: appConfig.branding.backgroundColor,
    theme_color: appConfig.branding.themeColor,
    icons: [
      {
        src: appConfig.branding.iconPath,
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: appConfig.branding.iconPath,
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
