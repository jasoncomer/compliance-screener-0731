import React, { createContext, useContext, useState, ReactNode } from 'react';

interface FlowTraceInitialization {
  addresses: string[];
  txId?: string;
}

interface FlowTraceContextType {
  initializationData: FlowTraceInitialization | null;
  setInitializationData: (data: FlowTraceInitialization | null) => void;
  clearInitializationData: () => void;
}

const FlowTraceContext = createContext<FlowTraceContextType | undefined>(undefined);

export const FlowTraceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [initializationData, setInitializationData] = useState<FlowTraceInitialization | null>(null);

  const clearInitializationData = () => {
    console.log('Clearing FlowTrace initialization data');
    setInitializationData(null);
  };

  const setInitializationDataWithLogging = (data: FlowTraceInitialization | null) => {
    console.log('Setting FlowTrace initialization data:', data);
    setInitializationData(data);
  };

  return (
    <FlowTraceContext.Provider value={{
      initializationData,
      setInitializationData: setInitializationDataWithLogging,
      clearInitializationData
    }}>
      {children}
    </FlowTraceContext.Provider>
  );
};

export const useFlowTraceInitialization = () => {
  const context = useContext(FlowTraceContext);
  if (context === undefined) {
    throw new Error('useFlowTraceInitialization must be used within a FlowTraceProvider');
  }
  return context;
};