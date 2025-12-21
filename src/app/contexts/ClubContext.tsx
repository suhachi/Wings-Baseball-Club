import React, { createContext, useContext, useState } from 'react';

interface ClubContextType {
  currentClubId: string;
  setCurrentClubId: (id: string) => void;
}

const ClubContext = createContext<ClubContextType | undefined>(undefined);

export const ClubProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Default to a hardcoded club ID for the prototype/v1.0
  // In a real multi-club app, this would be determined by URL or user selection
  const [currentClubId, setCurrentClubId] = useState<string>('WINGS');

  return (
    <ClubContext.Provider value={{ currentClubId, setCurrentClubId }}>
      {children}
    </ClubContext.Provider>
  );
};

export const useClub = () => {
  const context = useContext(ClubContext);
  if (context === undefined) {
    throw new Error('useClub must be used within a ClubProvider');
  }
  return context;
};
