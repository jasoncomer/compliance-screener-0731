import mixpanel from 'mixpanel-browser';

const MIXPANEL_TOKEN = import.meta.env.VITE_MIXPANEL_TOKEN || '';

// Initialize Mixpanel
mixpanel.init(MIXPANEL_TOKEN, {
  debug: import.meta.env.DEV,
  track_pageview: true,
  persistence: 'localStorage'
});

// Utility functions for tracking
export const track = (eventName: string, properties?: Record<string, any>) => {
  mixpanel.track(eventName, properties);
};

export const identify = (userId: string) => {
  mixpanel.identify(userId);
};

export const setUserProperties = (properties: Record<string, any>) => {
  mixpanel.people.set(properties);
};

export const reset = () => {
  mixpanel.reset();
};

export default mixpanel; 
