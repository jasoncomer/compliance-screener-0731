// AppContext.tsx
import React, { createContext, useState, ReactNode, useContext, useCallback } from 'react';
import { IUser } from '../typings/interfaces';
import { IAttributionMap, ReferenceAttributionMap } from '../typings/ReferenceAttribution';
import { storage } from '../utils/storage';
import { setAuthToken } from '../api/api';

export interface AppContextProps {
  user: IUser | null;
  setUser: React.Dispatch<React.SetStateAction<IUser | null>>;
  attributions: IAttributionMap;
  setAttributions: React.Dispatch<React.SetStateAction<IAttributionMap>>;
  referenceAttributions: ReferenceAttributionMap;
  setReferenceAttributions: React.Dispatch<React.SetStateAction<ReferenceAttributionMap>>;
  clearAppData: () => void;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<IUser | null>(null);
  const [attributions, setAttributions] = useState<IAttributionMap>({});
  const [referenceAttributions, setReferenceAttributions] = useState<ReferenceAttributionMap>({});

  const clearAppData = useCallback(() => {
    // Clear app state
    setUser(null);
    setAttributions({});
    setReferenceAttributions({});
    
    // Clear auth storage
    storage.auth.clearAuth();
    
    // Clear API token
    setAuthToken('');
  }, []);

  return (
    <AppContext.Provider value={{ user, setUser, attributions, setAttributions, referenceAttributions, setReferenceAttributions, clearAppData }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextProps => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};