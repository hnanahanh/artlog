import { createContext, useContext, useState, useCallback } from 'react';
import en from './en.json';
import vi from './vi.json';

const locales = { en, vi };
const I18nContext = createContext();

export function I18nProvider({ children, defaultLang = 'vi' }) {
  const [lang, setLang] = useState(defaultLang);

  const t = useCallback((key) => {
    return locales[lang]?.[key] || locales.en[key] || key;
  }, [lang]);

  const toggleLang = useCallback(() => {
    setLang(prev => prev === 'en' ? 'vi' : 'en');
  }, []);

  return (
    <I18nContext.Provider value={{ lang, setLang, toggleLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
