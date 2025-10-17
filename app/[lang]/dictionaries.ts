import 'server-only';

const dictionaries = {
  en: () => import('./dictionaries/en.json').then((module) => module.default),
  mr: () => import('./dictionaries/mr.json').then((module) => module.default),
};

export const getDictionary = async (locale: 'en' | 'mr') => dictionaries[locale]();
