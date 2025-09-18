import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AutosaveContextType {
  autosaveInterval: number; // in minutes
  setAutosaveInterval: (minutes: number) => void;
  isAutosaveEnabled: boolean;
  setIsAutosaveEnabled: (enabled: boolean) => void;
}

const AutosaveContext = createContext<AutosaveContextType | undefined>(undefined);

interface AutosaveProviderProps {
  children: ReactNode;
}

export const AutosaveProvider: React.FC<AutosaveProviderProps> = ({ children }) => {
  const [autosaveInterval, setAutosaveIntervalState] = useState<number>(60); // Default 1 hour
  const [isAutosaveEnabled, setIsAutosaveEnabledState] = useState<boolean>(true); // Default enabled

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedInterval = localStorage.getItem('flowtrace-autosave-interval');
    const savedEnabled = localStorage.getItem('flowtrace-autosave-enabled');
    
    if (savedInterval) {
      setAutosaveIntervalState(parseInt(savedInterval, 10));
    }
    
    if (savedEnabled !== null) {
      setIsAutosaveEnabledState(savedEnabled === 'true');
    }
  }, []);

  const setAutosaveInterval = (minutes: number) => {
    setAutosaveIntervalState(minutes);
    localStorage.setItem('flowtrace-autosave-interval', minutes.toString());
  };

  const setIsAutosaveEnabled = (enabled: boolean) => {
    setIsAutosaveEnabledState(enabled);
    localStorage.setItem('flowtrace-autosave-enabled', enabled.toString());
  };

  return (
    <AutosaveContext.Provider
      value={{
        autosaveInterval,
        setAutosaveInterval,
        isAutosaveEnabled,
        setIsAutosaveEnabled,
      }}
    >
      {children}
    </AutosaveContext.Provider>
  );
};

export const useAutosave = () => {
  const context = useContext(AutosaveContext);
  if (context === undefined) {
    throw new Error('useAutosave must be used within an AutosaveProvider');
  }
  return context;
};