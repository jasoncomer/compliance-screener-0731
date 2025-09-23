import React from 'react';
import { Shield, Eye, Loader2, Info } from 'lucide-react';
import { Tag } from 'antd';
import { useTheme } from "../../../../context/ThemeContext";

interface RiskAssessmentProps {
  score: number;
  level: string;
  description: string;
  isLoading?: boolean;
  onSeeDetails?: () => void;
  boInfo?: {
    entityName: string;
    entityType: string;
    entityTags: string[];
    ofac: boolean;
    isBeneficialOwnerOverride: boolean;
  };
}

const RiskAssessment: React.FC<RiskAssessmentProps> = ({ 
  score, 
  level, 
  description, 
  isLoading = false,
  onSeeDetails,
  boInfo
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
    <div className={`rounded-2xl border p-4 h-full flex flex-col justify-center items-center ${
      theme === 'dark' 
        ? 'bg-gray-800/50 border-gray-700' 
        : 'bg-gray-50 border-gray-200'
    }`}>
      <h5 className={`text-lg font-semibold mb-3 ${
        theme === 'dark' ? 'text-white' : 'text-gray-900'
      }`}>Risk Assessment</h5>
      
      <div className="flex items-center mb-3">
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
      
      <div className="flex items-center justify-center mb-4">
        <div className="font-semibold text-lg mr-2" style={{ color: riskColor }}>
          {level}
        </div>
        <div className="relative group">
          <Info 
            className="w-4 h-4 cursor-help text-gray-500 dark:text-gray-400" 
          />
          <div className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 min-w-[300px] max-w-[400px] ${
            theme === 'dark' 
              ? 'bg-gray-800 text-gray-200 border border-gray-700' 
              : 'bg-white text-gray-800 border border-gray-200'
          }`}>
            {description}
            <div className={`absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent ${
              theme === 'dark' 
                ? 'border-t-gray-800' 
                : 'border-t-white'
            }`}></div>
          </div>
        </div>
      </div>

      {/* BO Override Information */}
      {boInfo?.isBeneficialOwnerOverride && (
        <div className="mb-4 p-3 rounded-lg border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20">
          <div className="text-center">
            <div className="text-xs text-orange-600 dark:text-orange-400 mb-1 font-medium">
              Risk from Beneficial Owner:
            </div>
            <div className="text-sm font-semibold text-orange-700 dark:text-orange-300 mb-2">
              {boInfo.entityName}
            </div>
            {boInfo.ofac && (
              <div className="flex justify-center">
                <Tag color="red" className="text-xs">OFAC SANCTIONED</Tag>
              </div>
            )}
          </div>
        </div>
      )}
      
      <button 
        className={`w-full rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center gap-2 py-1.5 px-3 ${
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