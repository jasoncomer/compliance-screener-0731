// AppContext.tsx
import React, { createContext, useState, ReactNode, useContext } from 'react';
import { ICase, IUser } from '../typings/interfaces';

export interface AppContextProps {
  user: IUser | null;
  setUser: React.Dispatch<React.SetStateAction<IUser | null>>;
  cases: ICase[];
  setCases: React.Dispatch<React.SetStateAction<ICase[]>>;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<IUser | null>(null);
  const [cases, setCases] = useState<ICase[]>([]);
  // Add other state and setters here

  return (
    <AppContext.Provider value={{ user, setUser, cases, setCases }}>
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