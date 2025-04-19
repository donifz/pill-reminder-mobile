import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { en } from './en';
import { ru } from './ru';
import { ky } from './ky';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ru: { translation: ru },
      ky: { translation: ky },
    },
    lng: 'ky', // default language set to Kyrgyz
    fallbackLng: 'en', // fallback to English if translation is missing
    interpolation: {
      escapeValue: false,
    },
  });

export { i18n }; 