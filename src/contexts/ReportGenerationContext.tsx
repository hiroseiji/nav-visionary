import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ReportGenerationContextType {
  isGenerating: boolean;
  setIsGenerating: (value: boolean) => void;
  currentReportId: string | null;
  setCurrentReportId: (value: string | null) => void;
  progress: number;
  setProgress: (value: number) => void;
}

const ReportGenerationContext = createContext<ReportGenerationContextType>({
  isGenerating: false,
  setIsGenerating: () => {},
  currentReportId: null,
  setCurrentReportId: () => {},
  progress: 0,
  setProgress: () => {},
});

export const useReportGeneration = () => useContext(ReportGenerationContext);

interface ReportGenerationProviderProps {
  children: ReactNode;
}

export const ReportGenerationProvider: React.FC<ReportGenerationProviderProps> = ({ children }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentReportId, setCurrentReportId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  return (
    <ReportGenerationContext.Provider
      value={{
        isGenerating,
        setIsGenerating,
        currentReportId,
        setCurrentReportId,
        progress,
        setProgress,
      }}
    >
      {children}
    </ReportGenerationContext.Provider>
  );
};
