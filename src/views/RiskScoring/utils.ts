import React from 'react';
import { WarningOutlined, CheckCircleOutlined } from '@ant-design/icons';

export const getRiskColor = (score: number): string => {
  if (score > 70) return '#cf1322';
  if (score > 40) return '#faad14';
  return '#3f8600';
};

export const getRiskIcon = (severity: 'high' | 'medium' | 'low'): React.ReactNode => {
  switch (severity) {
    case 'high':
      return React.createElement(WarningOutlined, { style: { color: '#cf1322' } });
    case 'medium':
      return React.createElement(WarningOutlined, { style: { color: '#faad14' } });
    case 'low':
      return React.createElement(CheckCircleOutlined, { style: { color: '#3f8600' } });
  }
}; 