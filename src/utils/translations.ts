import React from 'react';

// Define and export Language type
export type Language = 'en' | 'fr';

// Type for translation values
type TranslationValue = string | { [key: string]: TranslationValue };

// Type for the messages object
type MessagesType = {
  [key in Language]: Record<string, TranslationValue>;
};

// Messages will be loaded dynamically to avoid Turbopack issues
export const messages: MessagesType = {
  en: {},
  fr: {}
};

// Cache for loaded languages
const loadedLanguages = new Set<Language>();

/**
 * Loads translation messages for a specific language
 * @param lang - The language code to load ('en' or 'fr')
 * @returns Promise that resolves when the messages are loaded
 */
export const loadMessages = async (lang: Language): Promise<boolean> => {
  // If already loaded, return immediately
  if (loadedLanguages.has(lang)) {
    return true;
  }

  try {
    // Use dynamic import to load the JSON file
    const module = await import(
      /* webpackChunkName: "locale-[request]" */
      `@/messages/${lang}.json`
    );
    
    // Update the messages object with the loaded translations
    messages[lang] = module.default;
    loadedLanguages.add(lang);
    
    console.log(`Successfully loaded ${lang} translations`);
    return true;
  } catch (error) {
    console.error(`Failed to load ${lang} messages:`, error);
    return false;
  }
};

// Preload default language in development
if (process.env.NODE_ENV === 'development') {
  // Only preload English by default to reduce initial load time
  loadMessages('en').catch(console.error);
}

// Type for interpolation values in translations
type InterpolationValues = { [key: string]: string | number };

/**
 * Gets a translated string for a given key and language
 * @param lang - The language code
 * @param key - The translation key (can use dot notation for nested objects)
 * @param values - Optional values to interpolate into the translation
 * @returns The translated string, or the key if not found
 */
export function getTranslation(lang: Language, key: string, values?: InterpolationValues): string {
  try {
    const keys = key.split('.');
    let current: TranslationValue = messages[lang] || {};
    
    // If messages are not loaded yet, return the key as a fallback
    if (Object.keys(current).length === 0) {
      console.warn(`Messages not loaded yet for language: ${lang}`);
      return key.split('.').pop() || key;
    }
    
    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = (current as { [key: string]: TranslationValue })[k];
      } else {
        console.warn(`Translation missing for key: ${key} in language: ${lang}`);
        return key.split('.').pop() || key; // Return the last part of the key as fallback
      }
    }
    
    if (typeof current !== 'string') {
      console.warn(`Invalid translation type for key: ${key} in language: ${lang}`);
      return key.split('.').pop() || key;
    }
    
    if (values) {
      return current.replace(/\{([^}]+)\}/g, (_, key) => {
        const value = values[key];
        if (value === undefined) {
          console.warn(`Missing interpolation value for key: ${key}`);
          return `{${key}}`;
        }
        return value.toString();
      });
    }
    
    return current;
  } catch (error) {
    console.error(`Translation error for key: ${key}`, error);
    return key.split('.').pop() || key;
  }
}

/**
 * Hook to access translations in React components
 * @param lang - The language to use for translations
 * @returns Object containing the translation function and loading state
 */
export function useTranslation(lang: Language) {
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);
  const [initialLoad, setInitialLoad] = React.useState(true);
  
  // Load messages when language changes
  React.useEffect(() => {
    let isMounted = true;
    
    const load = async () => {
      if (!isMounted) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        await loadMessages(lang);
        
        if (isMounted) {
          setIsLoading(false);
          setError(null);
          setInitialLoad(false);
        }
      } catch (err) {
        if (isMounted) {
          console.error(`Failed to load translations for ${lang}:`, err);
          const translationError = err instanceof Error ? err : new Error(String(err));
          setError(translationError);
          setIsLoading(false);
          setInitialLoad(false);
        }
      }
    };
    
    // Only load if not already in the cache or if we're forcing a reload
    if (!loadedLanguages.has(lang) || !initialLoad) {
      load();
    } else if (isLoading) {
      setIsLoading(false);
      setInitialLoad(false);
    }
    
    return () => {
      isMounted = false;
    };
  }, [lang]);
  
  // Memoize the translation function to prevent unnecessary re-renders
  const t = React.useCallback((key: string, values?: InterpolationValues) => {
    // If we're still loading and it's the initial load, return a loading message
    if (isLoading && initialLoad) {
      return '...';
    }
    
    // If there was an error loading translations, try to still get a translation
    if (error) {
      console.warn(`Using fallback translation for ${key} due to error:`, error);
    }
    
    // Get the translation
    const translation = getTranslation(lang, key, values);
    
    // If the translation is missing, log it for debugging
    if (translation === key) {
      console.warn(`Missing translation for key: ${key} in language: ${lang}`);
    }
    
    return translation;
  }, [lang, error, isLoading, initialLoad]);
  
  return { 
    t, 
    isLoading,
    error,
    isInitialLoad: initialLoad
  };
}
