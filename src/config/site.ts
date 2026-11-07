import { defaultLocale, locales } from '../i18n/locales.ts';

export const site = {
  name: 'base-landing-mocklab',
  description: 'Un punto de partida claro para tu próxima web.',
  language: locales[defaultLocale].lang,
} as const;
