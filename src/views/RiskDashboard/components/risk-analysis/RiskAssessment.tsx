import React from 'react';
import { Shield, Eye, Loader2 } from 'lucide-react';
import { useTheme } from "../../../../context/ThemeContext";

interface RiskAssessmentProps {
  score: number;
  level: string;
  description: string;
  isLoading?: boolean;
  onSeeDetails?: () => void;
}

const RiskAssessment: React.FC<RiskAssessmentProps> = ({ 
  score, 
  level, 
  description, 
  isLoading = false,
  onSeeDetails 
}) => {
  const { theme } = useTheme();

  const getRiskColor = (score: number): string => {
    if (score >= 80) return '#ef4444'; // Red for high risk
    if (score >= 50) return '#f59e0b'; // Orange for medium risk
    if (score >= 20) return '#10b981'; // Green for low risk
    return '#6b7280'; // Gray for very low risk
  };

  if (isLoading) {
    return (
      <div className={`rounded-2xl border p-6 h-full flex flex-col justify-center items-center ${
        theme === 'dark' 
          ? 'bg-gray-800/50 border-gray-700' 
          : 'bg-gray-50 border-gray-200'
      }`}>
        <h5 className={`text-lg font-semibold mb-4 ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>Risk Assessment</h5>
        <Loader2 className="w-8 h-8 animate-spin text-brand-primary mb-4" />
        <div className={`text-sm ${
          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
        }`}>Loading risk data...</div>
      </div>
    );
  }

  const riskColor = getRiskColor(score);

  return (
    <div className={`rounded-2xl border p-6 h-full flex flex-col justify-center items-center ${
      theme === 'dark' 
        ? 'bg-gray-800/50 border-gray-700' 
        : 'bg-gray-50 border-gray-200'
    }`}>
      <h5 className={`text-lg font-semibold mb-4 ${
        theme === 'dark' ? 'text-white' : 'text-gray-900'
      }`}>Risk Assessment</h5>
      
      <div className="flex items-center mb-4">
        <Shield className="w-8 h-8 mr-3" style={{ color: riskColor }} />
        <div className="text-center">
          <div className="text-4xl font-bold" style={{ color: riskColor }}>
            {score}
            <span className={`text-lg font-normal ml-1 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>/100</span>
          </div>
        </div>
      </div>
      
      <div className="font-semibold text-lg mb-2" style={{ color: riskColor }}>
        {level}
      </div>
      
      <div className={`text-sm text-center mb-6 px-4 ${
        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
      }`}>
        {description}
      </div>
      
      <button 
        className={`w-full rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center gap-2 py-2 px-4 ${
          onSeeDetails
            ? 'bg-brand-primary text-white hover:bg-brand-primary/90'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
        onClick={onSeeDetails}
        disabled={!onSeeDetails}
      >
        <Eye className="w-4 h-4" />
        View Details
      </button>
    </div>
  );
};

export default RiskAssessment; 