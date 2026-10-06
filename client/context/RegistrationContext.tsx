import React, { createContext, useContext, useState } from 'react';

type RegistrationData = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  isVerified?: boolean;
};

type RegistrationContextType = {
  data: RegistrationData | null;
  setData: (data: RegistrationData) => void;
  setVerified: (verified: boolean) => void;
  clear: () => void;
};

const RegistrationContext = createContext<RegistrationContextType | undefined>(undefined);

export const RegistrationProvider = ({ children }: { children: React.ReactNode }) => {
  const [data, setData] = useState<RegistrationData | null>(null);

  const setVerified = (verified: boolean) => {
    setData((prev) => (prev ? { ...prev, isVerified: verified } : null));
  };

  const clear = () => setData(null);

  return (
    <RegistrationContext.Provider value={{ data, setData, setVerified, clear }}>
      {children}
    </RegistrationContext.Provider>
  );
};

export const useRegistration = () => {
  const ctx = useContext(RegistrationContext);
  if (!ctx) throw new Error('useRegistration must be used within RegistrationProvider');
  return ctx;
};
