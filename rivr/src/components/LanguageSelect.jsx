import { useTranslation } from 'react-i18next';
import { languages } from '../i18n';
import { Globe, ChevronRight } from 'lucide-react';

export default function LanguageSelect({ onSelect }) {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language?.split('-')[0] || 'en';

  const handleSelect = (langCode) => {
    i18n.changeLanguage(langCode);
    onSelect(langCode);
  };

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center relative overflow-hidden px-4 py-8">
      {/* Content */}
      <div className="relative z-10 text-center max-w-md w-full">
        {/* Logo */}
        <div className="mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6 border border-primary/20 animate-glow-pulse">
            <Globe className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-5xl font-extrabold mb-3">
            <span className="gradient-text">Rivr</span>
          </h1>
          <p className="text-text-light text-lg">{t('app.tagline')}</p>
        </div>

        {/* Language title */}
        <div className="mb-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <h2 className="text-xl font-semibold text-white/90">{t('language.subtitle')}</h2>
        </div>

        {/* Language buttons */}
        <div className="grid grid-cols-2 gap-3 stagger-children">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleSelect(lang.code)}
              className={`group relative flex items-center gap-3 px-5 py-4 rounded-xl
                transition-all duration-300 cursor-pointer text-left
                ${currentLang === lang.code
                  ? 'bg-primary/15 border-2 border-primary shadow-lg shadow-primary/10'
                  : 'glass hover:border-white/20 hover:bg-white/5'
                }
              `}
            >
              <span className="text-2xl">{lang.flag}</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white text-sm">{lang.nativeName}</p>
                <p className="text-text-light text-xs">{lang.name}</p>
              </div>
              <ChevronRight className={`w-4 h-4 transition-transform duration-300
                ${currentLang === lang.code ? 'text-primary' : 'text-text-light opacity-0 group-hover:opacity-100'}
                group-hover:translate-x-1
              `} />
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}
