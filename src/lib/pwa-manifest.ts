export type PwaManifestConfig = {
  app: {
    name: string;
    shortName: string;
    description: string;
    homeHref: string;
  };
  branding: {
    iconPath: string;
    pwaIcon192Path: string;
    pwaIcon512Path: string;
    maskableIcon512Path: string;
    backgroundColor: string;
    themeColor: string;
  };
};

export type PwaManifestIcon = {
  src: string;
  sizes: string;
  type: string;
  purpose: "any" | "maskable";
};

export type PwaManifest = {
  name: string;
  short_name: string;
  description: string;
  start_url: string;
  scope: string;
  display: "standalone";
  background_color: string;
  theme_color: string;
  icons: PwaManifestIcon[];
};

export function buildPwaManifest(config: PwaManifestConfig): PwaManifest {
  return {
    name: config.app.name,
    short_name: config.app.shortName,
    description: config.app.description,
    start_url: config.app.homeHref,
    scope: "/",
    display: "standalone" as const,
    background_color: config.branding.backgroundColor,
    theme_color: config.branding.themeColor,
    icons: [
      {
        src: config.branding.iconPath,
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: config.branding.pwaIcon192Path,
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: config.branding.pwaIcon512Path,
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: config.branding.maskableIcon512Path,
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
