import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Your existing configuration
};

// A nova versão do SDK do Sentry para Next.js simplifica a configuração.
// Muitas opções são agora detectadas automaticamente ou configuradas no arquivo de instrumentação.
export default withSentryConfig(
  nextConfig,
  {
    // For all available options, see:
    // https://github.com/getsentry/sentry-webpack-plugin#options
    // Suppresses source map uploading logs during build
    silent: true,
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
  },
  {
    // For all available options, see:
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/
    // Oculta os source maps dos pacotes gerados no cliente para maior segurança
    hideSourceMaps: true,
    // Permite o upload de um conjunto maior de arquivos para o Sentry para melhor depuração
    widenClientFileUpload: true,
  }
);
