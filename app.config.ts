import type { ConfigContext, ExpoConfig } from 'expo/config';

const APP_VARIANTS = ['development', 'preview', 'production'] as const;

type AppVariant = (typeof APP_VARIANTS)[number];

const variantConfig: Record<AppVariant, { name: string; applicationId: string }> = {
  development: {
    name: 'Lexilo Dev',
    applicationId: 'com.hmnexus.lexilo.dev',
  },
  preview: {
    name: 'Lexilo Preview',
    applicationId: 'com.hmnexus.lexilo.preview',
  },
  production: {
    name: 'Lexilo',
    applicationId: 'com.hmnexus.lexilo',
  },
};

function getAppVariant(): AppVariant {
  const value = process.env.APP_VARIANT ?? 'production';

  if (!APP_VARIANTS.includes(value as AppVariant)) {
    throw new Error(`APP_VARIANT must be one of: ${APP_VARIANTS.join(', ')}. Received: ${value}`);
  }

  return value as AppVariant;
}

export default ({ config }: ConfigContext): ExpoConfig => {
  const appVariant = getAppVariant();
  const { name, applicationId } = variantConfig[appVariant];

  return {
    ...config,
    name,
    slug: config.slug ?? 'lexilo',
    ios: {
      ...config.ios,
      bundleIdentifier: applicationId,
    },
    android: {
      ...config.android,
      package: applicationId,
    },
    extra: {
      ...config.extra,
      appVariant,
    },
  };
};
