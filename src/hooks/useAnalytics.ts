import { useCallback } from 'react';

import { identify, reset,setUserProperties, track } from '../config/mixpanel';

export const useAnalytics = () => {
  const trackEvent = useCallback((eventName: string, properties?: Record<string, any>) => {
    track(eventName, properties);
  }, []);

  const trackUser = useCallback((userId: string, userProperties?: Record<string, any>) => {
    identify(userId);
    if (userProperties) {
      setUserProperties(userProperties);
    }
  }, []);

  const trackPageView = useCallback((pageName: string, properties?: Record<string, any>) => {
    track('Page View', {
      page: pageName,
      ...properties
    });
  }, []);

  const trackError = useCallback((error: Error, context?: Record<string, any>) => {
    track('Error Occurred', {
      errorMessage: error.message,
      errorStack: error.stack,
      ...context
    });
  }, []);

  const clearUser = useCallback(() => {
    reset();
  }, []);

  return {
    trackEvent,
    trackUser,
    trackPageView,
    trackError,
    clearUser
  };
}; 