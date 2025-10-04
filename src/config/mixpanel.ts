import mixpanel from 'mixpanel-browser';

const MIXPANEL_TOKEN = import.meta.env.VITE_MIXPANEL_TOKEN || 'dev-token';

// Initialize Mixpanel only if token is provided
let isMixpanelInitialized = false;
if (MIXPANEL_TOKEN && MIXPANEL_TOKEN !== '') {
  try {
    mixpanel.init(MIXPANEL_TOKEN, {
      debug: import.meta.env.DEV,
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
