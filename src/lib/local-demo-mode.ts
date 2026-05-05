type LocalDemoModeConfig = {
  development?: {
    localDemoMode?: boolean;
  };
};

export function isLocalDemoModeEnabled({
  config,
  nodeEnv = process.env.NODE_ENV,
}: {
  config: LocalDemoModeConfig;
  nodeEnv?: string;
}) {
  return config.development?.localDemoMode === true && nodeEnv === "development";
}

