import React from 'react';
import { Card, Statistic, Button, Typography, Spin } from 'antd';
import { SafetyOutlined, EyeOutlined } from '@ant-design/icons';
import { useTheme } from '../../../../context/ThemeContext';

const { Title } = Typography;

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
    if (score > 70) return '#cf1322'; // Red for high risk
    if (score > 40) return '#faad14'; // Orange for medium risk
    return '#3f8600'; // Green for low risk
  };

  const getRiskIconColor = (score: number): string => {
    if (score > 70) return '#cf1322';
    if (score > 40) return '#faad14';
    return '#3f8600';
  };

  if (isLoading) {
    return (
      <Card className={`${theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'} rounded-2xl h-full flex flex-col justify-center items-center`}>
        <Title level={5} className={`${theme === 'light' ? 'text-gray-900' : 'text-white'} mb-4`}>Risk Assessment</Title>
        <Spin size="large" />
        <div className={`${theme === 'light' ? 'text-gray-500' : 'text-gray-400'} text-sm mt-4`}>Loading risk data...</div>
      </Card>
    );
  }

  const riskColor = getRiskColor(score);
  const iconColor = getRiskIconColor(score);

  return (
    <Card className={`${theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'} rounded-2xl h-full flex flex-col justify-center items-center`}>
      <Title level={5} className={`${theme === 'light' ? 'text-gray-900' : 'text-white'} mb-4`}>Risk Assessment</Title>
      <Statistic
        value={score}
        valueStyle={{ color: riskColor, fontSize: '3rem', fontWeight: 700 }}
        prefix={<SafetyOutlined className="mr-2" style={{ color: iconColor }} />}
        suffix={<span className={`${theme === 'light' ? 'text-gray-500' : 'text-gray-400'} text-lg`}>/100</span>}
      />
      <div className="font-semibold text-lg mt-2" style={{ color: riskColor }}>{level}</div>
      <div className={`${theme === 'light' ? 'text-gray-500' : 'text-gray-400'} text-sm mb-4`}>{description}</div>
      <Button 
        type="default" 
        className="w-full rounded-lg bg-orange-500 text-white border-none font-semibold hover:bg-orange-600 hover:border-orange-600 transition-colors duration-200"
        onClick={onSeeDetails}
        disabled={!onSeeDetails}
        icon={<EyeOutlined />}
      >
        View Details
      </Button>
    </Card>
  );
};

export default RiskAssessment; 