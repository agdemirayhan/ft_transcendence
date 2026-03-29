'use client';

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enCommon from '../public/locales/en/common.json';
import trCommon from '../public/locales/tr/common.json';
import deCommon from '../public/locales/de/common.json';

if (!i18n.isInitialized) {
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources: {
        en: { common: enCommon },
        tr: { common: trCommon },
        de: { common: deCommon },
      },
      fallbackLng: 'en',
      defaultNS: 'common',
      initImmediate: false,
      interpolation: { escapeValue: false },
      detection: {
        order: ['localStorage'],
        lookupLocalStorage: 'language',
        caches: ['localStorage'],
      },
    });
}

export default i18n;