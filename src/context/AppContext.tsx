// AppContext.tsx
import React, { createContext, useState, ReactNode, useContext } from 'react';
import { ICase, IUser } from '../typings/interfaces';
import { IAttributionMap, ReferenceAttributionMap } from '../typings/ReferenceAttribution';

export interface AppContextProps {
  user: IUser | null;
  setUser: React.Dispatch<React.SetStateAction<IUser | null>>;
  cases: ICase[];
  setCases: React.Dispatch<React.SetStateAction<ICase[]>>;
  attributions: IAttributionMap;
  setAttributions: React.Dispatch<React.SetStateAction<IAttributionMap>>;
  referenceAttributions: ReferenceAttributionMap;
  setReferenceAttributions: React.Dispatch<React.SetStateAction<ReferenceAttributionMap>>;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<IUser | null>(null);
  const [cases, setCases] = useState<ICase[]>([]);
  const [attributions, setAttributions] = useState<IAttributionMap>({});
  const [referenceAttributions, setReferenceAttributions] = useState<ReferenceAttributionMap>({});

  return (
    <AppContext.Provider value={{ user, setUser, cases, setCases, attributions, setAttributions, referenceAttributions, setReferenceAttributions }}>
      {children}
    </AppContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAppContext = (): AppContextProps => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};