import mixpanel from 'mixpanel-browser';

import { config } from './config';

// Initialize Mixpanel only if token is provided and not in development
let isMixpanelInitialized = false;
if (!config.isDev && config.MIXPANEL_TOKEN) {
  try {
    mixpanel.init(config.MIXPANEL_TOKEN, {
      debug: false,
      track_pageview: false, // Disable automatic pageview tracking
      persistence: 'localStorage'
    });
    isMixpanelInitialized = true;
  } catch (error) {
    console.warn('Failed to initialize Mixpanel:', error);
  }
}

// Utility functions for tracking
export const track = (eventName: string, properties?: Record<string, any>) => {
  if (isMixpanelInitialized) {
    try {
      mixpanel.track(eventName, properties);
    } catch (error) {
      console.warn('Mixpanel track error:', error);
    }
  }
};

export const identify = (userId: string) => {
  if (isMixpanelInitialized) {
    try {
      mixpanel.identify(userId);
    } catch (error) {
      console.warn('Mixpanel identify error:', error);
    }
  }
};

export const setUserProperties = (properties: Record<string, any>) => {
  if (isMixpanelInitialized) {
    try {
      mixpanel.people.set(properties);
    } catch (error) {
      console.warn('Mixpanel setUserProperties error:', error);
    }
  }
};

export const reset = () => {
  if (isMixpanelInitialized) {
    try {
      mixpanel.reset();
    } catch (error) {
      console.warn('Mixpanel reset error:', error);
    }
  }
};

export default mixpanel; 
