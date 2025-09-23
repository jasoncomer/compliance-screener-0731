import React, { useEffect,useState } from 'react';

import { ClockCircleOutlined,InfoCircleOutlined } from '@ant-design/icons';
import { Alert,InputNumber, Select, Switch, Tooltip } from 'antd';

import { Card, Label,PreferencesGrid, PreferenceToggle, SubTitle } from './styled';

interface PreferencesSectionProps {
  theme: 'dark' | 'light';
  notifications: boolean;
  onNotificationsChange: (checked: boolean) => void;
  onThemeChange: () => void;
  autosaveInterval: number;
  onAutosaveIntervalChange: (minutes: number) => void;
  isAutosaveEnabled: boolean;
  onAutosaveEnabledChange: (enabled: boolean) => void;
}

const PreferencesSection: React.FC<PreferencesSectionProps> = ({
  theme,
  notifications,
  onNotificationsChange,
  onThemeChange,
  autosaveInterval,
  onAutosaveIntervalChange,
  isAutosaveEnabled,
  onAutosaveEnabledChange
}) => {
  const [autosaveValue, setAutosaveValue] = useState<number>(5);
  const [autosaveUnit, setAutosaveUnit] = useState<'minutes' | 'hours' | 'days'>('minutes');

  // Convert autosaveInterval (in minutes) to display value and unit
  useEffect(() => {
    if (autosaveInterval < 60) {
      setAutosaveValue(autosaveInterval);
      setAutosaveUnit('minutes');
    } else if (autosaveInterval < 1440) {
      setAutosaveValue(Math.round(autosaveInterval / 60));
      setAutosaveUnit('hours');
    } else {
      setAutosaveValue(Math.round(autosaveInterval / 1440));
      setAutosaveUnit('days');
    }
  }, [autosaveInterval]);

  const handleAutosaveValueChange = (value: number | null) => {
    if (value && value > 0) {
      setAutosaveValue(value);
      updateAutosaveInterval(value, autosaveUnit);
    }
  };

  const handleAutosaveUnitChange = (unit: 'minutes' | 'hours' | 'days') => {
    setAutosaveUnit(unit);
    updateAutosaveInterval(autosaveValue, unit);
  };

  const updateAutosaveInterval = (value: number, unit: 'minutes' | 'hours' | 'days') => {
    let minutes: number;
    switch (unit) {
      case 'minutes':
        minutes = value;
        break;
      case 'hours':
        minutes = value * 60;
        break;
      case 'days':
        minutes = value * 1440;
        break;
    }
    onAutosaveIntervalChange(minutes);
  };

  const getAutosaveTooltipText = () => {
    if (!isAutosaveEnabled) {
      return 'Autosave is currently disabled';
    }
    
    const value = autosaveValue;
    const unit = autosaveUnit;
    
    if (value === 1) {
      return `Your FlowTrace workspace will be automatically saved every ${value} ${unit.slice(0, -1)} (default: 1 hour)`;
    } else {
      return `Your FlowTrace workspace will be automatically saved every ${value} ${unit} (default: 1 hour)`;
    }
  };
  return (
    <Card theme={{ theme }}>
      <SubTitle theme={{ theme }}>App Preferences</SubTitle>
      <PreferencesGrid>
        <PreferenceToggle theme={{ theme }}>
          <Label theme={{ theme }} style={{ margin: 0 }}>Email Notifications</Label>
          <Switch
            checked={notifications}
            onChange={onNotificationsChange}
          />
        </PreferenceToggle>
        <PreferenceToggle theme={{ theme }}>
          <Label theme={{ theme }} style={{ margin: 0 }}>Dark Mode</Label>
          <Switch
            checked={theme === 'dark'}
            onChange={onThemeChange}
            checkedChildren="🌙"
            unCheckedChildren="☀️"
          />
        </PreferenceToggle>
        {/* FlowTrace Preferences Section */}
        <div style={{ 
          background: theme === 'dark' ? '#141414' : '#f8f9fa',
          border: `1px solid ${theme === 'dark' ? '#2d2d2d' : '#e0e0e0'}`,
          borderRadius: '12px',
          padding: '24px',
          transition: 'all 0.2s ease',
          marginTop: '8px'
        }}>
          {/* Section Header */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            marginBottom: '20px',
            paddingBottom: '12px',
            borderBottom: `1px solid ${theme === 'dark' ? '#2d2d2d' : '#e0e0e0'}`
          }}>
            <h3 style={{ 
              margin: 0, 
              fontSize: '18px', 
              fontWeight: '600',
              color: theme === 'dark' ? '#ffffff' : '#2c3e50'
            }}>
              FlowTrace Preferences
            </h3>
          </div>

          {/* Autosave Settings */}
          <div>
            {/* Main Toggle */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              marginBottom: isAutosaveEnabled ? '20px' : '0'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Label theme={{ theme }} style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Autosave</Label>
                <Tooltip title="Automatically save your FlowTrace workspace at regular intervals" placement="top">
                  <InfoCircleOutlined 
                    style={{ 
                      color: theme === 'dark' ? '#a0a0a0' : '#7f8c8d',
                      fontSize: '14px',
                      cursor: 'help'
                    }} 
                  />
                </Tooltip>
              </div>
              <Switch
                checked={isAutosaveEnabled}
                onChange={onAutosaveEnabledChange}
                size="default"
              />
            </div>

            {/* Frequency Settings - Only show when enabled */}
            {isAutosaveEnabled && (
              <>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  marginBottom: '16px',
                  padding: '12px 16px',
                  background: theme === 'dark' ? '#1a1a1a' : '#ffffff',
                  borderRadius: '6px',
                  border: `1px solid ${theme === 'dark' ? '#3d3d3d' : '#d0d0d0'}`
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Label theme={{ theme }} style={{ margin: 0, fontSize: '14px' }}>Frequency</Label>
                    <Tooltip title={getAutosaveTooltipText()} placement="top">
                      <InfoCircleOutlined 
                        style={{ 
                          color: theme === 'dark' ? '#a0a0a0' : '#7f8c8d',
                          fontSize: '12px',
                          cursor: 'help'
                        }} 
                      />
                    </Tooltip>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <InputNumber
                      value={autosaveValue}
                      onChange={handleAutosaveValueChange}
                      min={1}
                      max={999}
                      style={{ width: 80 }}
                      size="small"
                    />
                    <Select
                      value={autosaveUnit}
                      onChange={handleAutosaveUnitChange}
                      style={{ width: 100 }}
                      size="small"
                      options={[
                        { value: 'minutes', label: 'minutes' },
                        { value: 'hours', label: 'hours' },
                        { value: 'days', label: 'days' },
                      ]}
                    />
                  </div>
                </div>

                {/* Information Alert */}
                <Alert
                  message="Autosave Information"
                  description={
                    <div>
                      <p style={{ margin: '0 0 8px 0' }}>
                        <ClockCircleOutlined style={{ marginRight: '6px' }} />
                        Your FlowTrace workspace is set to automatically save every <strong>{autosaveValue} {autosaveUnit}</strong>.
                      </p>
                      <p style={{ margin: 0, fontSize: '13px', opacity: 0.8 }}>
                        This helps prevent data loss while you work. You can adjust the frequency above or disable autosave if you prefer manual saving.
                      </p>
                    </div>
                  }
                  type="info"
                  showIcon
                  style={{ 
                    backgroundColor: theme === 'dark' ? '#1a1a2e' : '#f0f8ff',
                    borderColor: theme === 'dark' ? '#2d4a69' : '#b3d9ff'
                  }}
                />
              </>
            )}
          </div>
        </div>
      </PreferencesGrid>
    </Card>
  );
};

export default PreferencesSection; 