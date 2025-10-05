import React, { useState } from 'react';
import { BarChart3, PieChart, TrendingUp, Activity } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { ReportModuleData } from '../CaseReportBuilderModal';

interface ChartModuleProps {
  module: ReportModuleData;
}

export const ChartModule: React.FC<ChartModuleProps> = ({ module }) => {
  const [chartType, setChartType] = useState(module.content?.chartType || 'bar');
  const [title, setTitle] = useState(module.content?.title || '');
  const [data, setData] = useState(module.content?.data || [
    { label: 'Low Risk', value: 45, color: '#10B981' },
    { label: 'Medium Risk', value: 30, color: '#F59E0B' },
    { label: 'High Risk', value: 25, color: '#EF4444' }
  ]);

  const handleChartTypeChange = (type: string) => {
    setChartType(type);
    module.content = { ...module.content, chartType: type };
  };

  const handleTitleChange = (value: string) => {
    setTitle(value);
    module.content = { ...module.content, title: value };
  };

  const addDataPoint = () => {
    const newData = [...data, { label: 'New Item', value: 0, color: '#6B7280' }];
    setData(newData);
    module.content = { ...module.content, data: newData };
  };

  const updateDataPoint = (index: number, field: string, value: any) => {
    const newData = [...data];
    newData[index] = { ...newData[index], [field]: value };
    setData(newData);
    module.content = { ...module.content, data: newData };
  };

  const removeDataPoint = (index: number) => {
    const newData = data.filter((_item: any, i: any) => i !== index);
    setData(newData);
    module.content = { ...module.content, data: newData };
  };

  const getChartIcon = (type: string) => {
    switch (type) {
      case 'bar':
        return <BarChart3 className="h-4 w-4" />;
      case 'pie':
        return <PieChart className="h-4 w-4" />;
      case 'line':
        return <TrendingUp className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const renderChart = () => {
    const total = data.reduce((sum: number, item: any) => sum + item.value, 0);

    switch (chartType) {
      case 'bar':
        return (
          <div className="space-y-2">
            {data.map((item: any, index: number) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-20 text-sm text-gray-600 dark:text-gray-400">{item.label}</div>
                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-6 relative">
                  <div
                    className="h-6 rounded-full flex items-center justify-end pr-2"
                    style={{
                      width: `${total > 0 ? (item.value / total) * 100 : 0}%`,
                      backgroundColor: item.color
                    }}
                  >
                    <span className="text-xs font-medium text-white">{item.value}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );
      
      case 'pie':
        let cumulativePercentage = 0;
        return (
          <div className="flex items-center gap-4">
            <div className="w-32 h-32 relative">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                {data.map((item: any, index: any) => {
                  const percentage = total > 0 ? (item.value / total) * 100 : 0;
                  const startAngle = (cumulativePercentage / 100) * 360;
                  const endAngle = ((cumulativePercentage + percentage) / 100) * 360;
                  cumulativePercentage += percentage;
                  
                  const x1 = 50 + 40 * Math.cos((startAngle - 90) * Math.PI / 180);
                  const y1 = 50 + 40 * Math.sin((startAngle - 90) * Math.PI / 180);
                  const x2 = 50 + 40 * Math.cos((endAngle - 90) * Math.PI / 180);
                  const y2 = 50 + 40 * Math.sin((endAngle - 90) * Math.PI / 180);
                  const largeArcFlag = percentage > 50 ? 1 : 0;
                  
                  const pathData = [
                    `M 50 50`,
                    `L ${x1} ${y1}`,
                    `A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                    'Z'
                  ].join(' ');
                  
                  return (
                    <path
                      key={index}
                      d={pathData}
                      fill={item.color}
                      stroke="white"
                      strokeWidth="0.5"
                    />
                  );
                })}
              </svg>
            </div>
            <div className="space-y-2">
              {data.map((item: any, index: any) => (
                <div key={index} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm">{item.label}: {item.value}</span>
                </div>
              ))}
            </div>
          </div>
        );
      
      default:
        return <div className="text-center text-gray-500">Chart preview not available</div>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        {getChartIcon(chartType)}
        <h4 className="font-semibold">Chart Module</h4>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="chart-title">Chart Title</Label>
            <Input
              id="chart-title"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Enter chart title..."
            />
          </div>
          
          <div>
            <Label>Chart Type</Label>
            <Select value={chartType} onValueChange={handleChartTypeChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bar">Bar Chart</SelectItem>
                <SelectItem value="pie">Pie Chart</SelectItem>
                <SelectItem value="line">Line Chart</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Data Points */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label>Data Points</Label>
            <Button onClick={addDataPoint} size="sm" variant="outline">
              Add Data Point
            </Button>
          </div>
          
          <div className="space-y-2">
            {data.map((item: any, index: any) => (
              <div key={index} className="flex items-center gap-2 p-2 border border-gray-200 dark:border-gray-700 rounded">
                <Input
                  value={item.label}
                  onChange={(e) => updateDataPoint(index, 'label', e.target.value)}
                  placeholder="Label"
                  className="flex-1"
                />
                <Input
                  type="number"
                  value={item.value}
                  onChange={(e) => updateDataPoint(index, 'value', parseInt(e.target.value) || 0)}
                  placeholder="Value"
                  className="w-20"
                />
                <Input
                  type="color"
                  value={item.color}
                  onChange={(e) => updateDataPoint(index, 'color', e.target.value)}
                  className="w-12 h-8"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeDataPoint(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  ×
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Chart Preview */}
        <Card>
          <CardContent className="p-4">
            <h5 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-4">Preview:</h5>
            {title && <h3 className="text-lg font-semibold mb-4 text-center">{title}</h3>}
            {renderChart()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};