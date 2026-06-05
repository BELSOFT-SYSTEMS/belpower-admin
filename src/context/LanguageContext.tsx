/**
 * Language Context Module
 * 
 * This module provides language management functionality for the application.
 * It handles:
 * - Language selection (English and French)
 * - Language persistence in localStorage
 * - Automatic language detection and application
 * - Type-safe language switching
 */

"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { type Language, loadMessages } from '@/utils/translations';

// Type for the context value
interface LanguageContextType {
  /** Current active language */
  currentLanguage: Language;
  /** Function to change the active language */
  setLanguage: (lang: Language) => void;
  /** Whether the language is currently being loaded */
  isLoading: boolean;
  /** Error that occurred while loading the language, if any */
  error: Error | null;
  /** Whether there is an error */
  hasError: boolean;
  /** Clear the current error */
  clearError: () => void;
}

/**
 * Type definition for the Language Context
 * Provides type safety for language-related operations
 */
interface LanguageContextType {
  /** Current active language */
  currentLanguage: Language;
  /** Function to change the active language */
  setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

/**
 * Language Provider Component
 * 
 * Provides language context to the application and handles:
 * - Initial language detection
 * - Language persistence
 * - Language switching
 * 
 * @param children - Child components that will have access to language context
 */
export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [currentLanguage, setCurrentLanguage] = useState<Language>('en');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  // Load saved language on mount
  useEffect(() => {
    const initializeLanguage = async () => {
      try {
        setIsLoading(true);
        const savedLanguage = localStorage.getItem('selectedLanguage');
        
        // Validate the saved language
        if (savedLanguage === 'en' || savedLanguage === 'fr') {
          // Preload the language messages
          await loadMessages(savedLanguage);
          setCurrentLanguage(savedLanguage);
        } else {
          // Default to English if no valid language is saved
          setCurrentLanguage('en');
          localStorage.setItem('selectedLanguage', 'en');
          // Preload English messages
          await loadMessages('en');
        }
      } catch (err) {
        console.error('Failed to initialize language:', err);
        setError(err instanceof Error ? err : new Error('Failed to initialize language'));
      } finally {
        setIsLoading(false);
      }
    };

    initializeLanguage();
  }, []);

  /**
   * Changes the application language
   * - Updates the current language
   * - Persists the selection to localStorage
   * - Updates the document language attribute
   * 
   * @param lang - The new language to set ('en' or 'fr')
   */
  const setLanguage = useCallback(async (lang: Language) => {
    try {
      if (lang === currentLanguage) return; // No change needed
      
      setIsLoading(true);
      setError(null);
      
      console.log('Loading language:', lang);
      
      try {
        // Preload the new language messages
        await loadMessages(lang);
        
        // Update the current language and persist to localStorage
        setCurrentLanguage(lang);
        localStorage.setItem('selectedLanguage', lang);
        
        // Update the document language attribute
        document.documentElement.lang = lang;
        
      } catch (err) {
        console.error(`Failed to switch to language ${lang}:`, err);
        setError(err instanceof Error ? err : new Error(`Failed to switch to language ${lang}`));
        throw err; // Re-throw to be caught by the outer catch
      } finally {
        setIsLoading(false);
      }
    } catch (err) {
      console.error(`Error in setLanguage for ${lang}:`, err);
      setError(err instanceof Error ? err : new Error(`Error switching to ${lang}`));
      setIsLoading(false);
      throw err; // Re-throw to allow components to handle the error if needed
    }
  }, [currentLanguage]);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo<LanguageContextType>(() => ({
    currentLanguage,
    setLanguage,
    isLoading,
    error,
    // Add a helper to check if there's an error
    hasError: !!error,
    // Add a method to clear the error
    clearError: () => setError(null)
  }), [currentLanguage, setLanguage, isLoading, error]);

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
}

/**
 * Custom hook to access the language context
 * 
 * @returns LanguageContextType containing currentLanguage, setLanguage, and other context values
 * @throws Error if used outside of LanguageProvider
 */
export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  
  // Add error boundary to prevent crashes if the context is malformed
  if (!context) {
    console.error('Language context is null or undefined');
    return {
      currentLanguage: 'en',
      setLanguage: () => {},
      isLoading: false,
      error: null,
      hasError: false,
      clearError: () => {}
    };
  }
  
  return context;
};
