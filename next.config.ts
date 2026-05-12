import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const productionLocalDemoStubForWebpack = path.join(root, "src", "lib", "local-demo-supabase.production.ts");
const productionLocalDevLoginStubForWebpack = path.join(root, "src", "lib", "local-dev-login.production.ts");
const productionLocalDemoStubForTurbopack = "./src/lib/local-demo-supabase.production.ts";
const productionLocalDevLoginStubForTurbopack = "./src/lib/local-dev-login.production.ts";
const isProductionBuild = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true, // Required for static export if using Next/Image
  },
  turbopack: {
    ...(isProductionBuild
      ? {
          resolveAlias: {
            "@/lib/local-demo-supabase": productionLocalDemoStubForTurbopack,
            "@/lib/local-dev-login": productionLocalDevLoginStubForTurbopack,
          },
        }
      : {}),
  },
  webpack: (config) => {
    if (isProductionBuild) {
      config.resolve = config.resolve ?? {};
      config.resolve.alias = {
        ...(config.resolve.alias ?? {}),
        "@/lib/local-demo-supabase": productionLocalDemoStubForWebpack,
        "@/lib/local-dev-login": productionLocalDevLoginStubForWebpack,
      };
    }

    return config;
  },
};

export default nextConfig;
