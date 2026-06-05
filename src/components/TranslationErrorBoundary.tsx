import React from 'react';
import { useLanguage } from '@/context/LanguageContext';

interface TranslationErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Component that catches and displays translation errors
 * Wraps components that use translations to provide a better user experience when errors occur
 */
export const TranslationErrorBoundary: React.FC<TranslationErrorBoundaryProps> = ({
  children,
  fallback = null,
}) => {
  const { error, clearError, hasError } = useLanguage();
  const [errorState, setErrorState] = React.useState<Error | null>(null);

  // Update error state when context error changes
  React.useEffect(() => {
    if (error) {
      console.error('Translation error caught by boundary:', error);
      setErrorState(error);
    } else {
      setErrorState(null);
    }
  }, [error]);

  // Clear the error when the component unmounts
  React.useEffect(() => {
    return () => {
      if (hasError) {
        clearError();
      }
    };
  }, [hasError, clearError]);

  // If there's an error and we have a fallback, render the fallback
  if (errorState && fallback) {
    return <>{fallback}</>;
  }

  // If there's an error but no fallback, render nothing
  if (errorState) {
    return null;
  }

  // Otherwise, render children
  return <>{children}</>;
};

/**
 * Higher-order component that wraps a component with TranslationErrorBoundary
 * @param Component The component to wrap
 * @param fallback Optional fallback component to render when there's an error
 */
export const withTranslationErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ReactNode
) => {
  const WrappedComponent: React.FC<P> = (props) => (
    <TranslationErrorBoundary fallback={fallback}>
      <Component {...props} />
    </TranslationErrorBoundary>
  );
  
  // Set a display name for better debugging
  WrappedComponent.displayName = `withTranslationErrorBoundary(${Component.displayName || Component.name || 'Component'})`;
  
  return WrappedComponent;
};

export default TranslationErrorBoundary;
