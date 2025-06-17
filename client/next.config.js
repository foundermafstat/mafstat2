/**
 * @type {import('next').NextConfig}
 */
const withNextIntl = require('next-intl/plugin')(
  // Укажем относительный путь к конфигурации next-intl
  './i18n.config.ts'
);

const nextConfig = {
  webpack: (config, { isServer }) => {
    // Игнорировать все HTML-файлы при сборке, чтобы избежать ошибок с node-модулями
    config.module.rules.push({
      test: /\.html$/,
      use: 'ignore-loader',
    });
    return config;
  },
};

module.exports = withNextIntl(nextConfig);
