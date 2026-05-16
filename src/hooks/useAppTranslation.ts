import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useTranslation as useBaseTranslation } from '@/utils/translations';

// Default fallback translations
const defaultTranslations = {
  en: require('@/messages/en.json'),
  fr: require('@/messages/fr.json'),
} as const;

// Type for the translation function
type TFunction = (key: string, values?: Record<string, string | number>) => string;

// Helper function to get a value from a nested object using dot notation
const getNestedValue = (obj: any, path: string): string | undefined => {
  if (!obj) return undefined;
  
  try {
    return path.split('.').reduce((current, key) => {
      if (current && typeof current === 'object' && key in current) {
        return current[key];
      }
      return undefined;
    }, obj);
  } catch (error) {
    console.error(`Error getting nested value for path '${path}':`, error);
    return undefined;
  }
};

/**
 * Hook to access translations in the application
 * Provides a stable translation function that falls back to default translations
 * when dynamic translations are not yet loaded
 */
export function useAppTranslation() {
  const { currentLanguage, isLoading: isLanguageLoading, error: languageError } = useLanguage();
  const { t: dynamicT, isLoading: isTranslating, error: translationError, isInitialLoad } = useBaseTranslation(currentLanguage);
  
  // Get translation with fallback to default translations
  const t = React.useCallback<TFunction>((key, values) => {
    if (!key) {
      console.warn('Translation key is empty');
      return '';
    }
    
    // Try to get the dynamic translation first
    if (!isTranslating && !isLanguageLoading) {
      try {
        const result = dynamicT(key, values);
        if (result && result !== key) {
          return result;
        }
      } catch (error) {
        console.error(`Error in dynamic translation for key '${key}':`, error);
      }
    }
    
    // Fall back to default translations
    try {
      const defaultTranslation = getNestedValue(defaultTranslations[currentLanguage], key);
      
      if (typeof defaultTranslation === 'string') {
        // Simple interpolation for default translations
        if (values) {
          return Object.entries(values).reduce(
            (str, [k, v]) => str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v)),
            defaultTranslation
          );
        }
        return defaultTranslation;
      }
    } catch (error) {
      console.error(`Error in fallback translation for key '${key}':`, error);
    }
    
    // As a last resort, return the last part of the key
    const fallback = key.split('.').pop() || key;
    
    // In development, log missing translations
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[useAppTranslation] Missing translation for key: ${key}`, {
        language: currentLanguage,
        isTranslating,
        isLanguageLoading,
        isInitialLoad,
        hasError: !!(languageError || translationError)
      });
    }
    
    // Always return the fallback without brackets
    return fallback;
  }, [currentLanguage, dynamicT, isTranslating, isLanguageLoading, isInitialLoad, languageError, translationError]);
  
  return { 
    t, 
    isLoading: isTranslating || isLanguageLoading,
    error: languageError || translationError,
    isInitialLoad
  };
}
