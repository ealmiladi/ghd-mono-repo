import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { en } from './en.json';
import { es } from './es.json';
import { zh } from './zh.json';
import { hi } from './hi.json';
import { ar } from './ar.json';
import { fr } from './fr.json';
import { ru } from './ru.json';
import { pt } from './pt.json';
import { de } from './de.json';
import { it } from './it.json';
import { uk } from './uk.json';
import { ja } from './ja.json';

i18n.use(initReactI18next).init({
    resources: {
        en: {
            translation: en.translation,
        },
        es: {
            translation: es.translation,
        },
        zh: {
            translation: zh.translation,
        },
        hi: {
            translation: hi.translation,
        },
        ar: {
            translation: ar.translation,
        },
        fr: {
            translation: fr.translation,
        },
        ru: {
            translation: ru.translation,
        },
        pt: {
            translation: pt.translation,
        },
        de: {
            translation: de.translation,
        },
        it: {
            translation: it.translation,
        },
        ukr: {
            translation: uk.translation,
        },
        ja: {
            translation: ja.translation,
        },
    },
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
        escapeValue: false, // React already escapes values
    },
});

export default i18n;
