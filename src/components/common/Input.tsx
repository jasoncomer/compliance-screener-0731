import React from 'react';
import { Input as AntInput, InputProps as AntInputProps } from 'antd';
import { useTheme } from '../../context/ThemeContext';
import styled from 'styled-components';

export interface CustomInputProps extends Omit<AntInputProps, 'size'> {
  error?: boolean;
  multiline?: boolean;
  rows?: number;
  onSearch?: (value: string) => void;
  loading?: boolean;
  enterButton?: boolean | React.ReactNode;
}

const StyledInput = styled(AntInput)<{ $theme: string; error?: boolean }>`
  height: 48px;
  border-radius: 12px;
  border: 2px solid ${({ $theme, error }) => 
    error 
      ? '#ef4444' 
      : $theme === 'dark' ? '#4a5568' : '#e2e8f0'};
  background: ${({ $theme }) => $theme === 'dark' ? '#2d3748' : '#ffffff'};
  color: ${({ $theme }) => $theme === 'dark' ? '#ffffff' : '#1a202c'};
  font-size: 14px;
  font-weight: 400;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: ${({ $theme, error }) => 
      error 
        ? '#ef4444' 
        : $theme === 'dark' ? '#718096' : '#cbd5e0'};
  }
  
  &:focus,
  &.ant-input-focused {
    border-color: #e87e4f;
    box-shadow: 0 0 0 3px rgba(232, 126, 79, 0.1);
    outline: none;
  }
  
  &::placeholder {
    color: ${({ $theme }) => $theme === 'dark' ? '#a0aec0' : '#718096'};
  }
  
  &.ant-input-password {
    .ant-input-password-icon {
      color: ${({ $theme }) => $theme === 'dark' ? '#a0aec0' : '#718096'};
    }
  }
`;

const TextAreaStyles = styled.div<{ $theme: string; error?: boolean }>`
  .ant-input {
    border-radius: 12px;
    border: 2px solid ${({ $theme, error }) => 
      error 
        ? '#ef4444' 
        : $theme === 'dark' ? '#4a5568' : '#e2e8f0'};
    background: ${({ $theme }) => $theme === 'dark' ? '#2d3748' : '#ffffff'};
    color: ${({ $theme }) => $theme === 'dark' ? '#ffffff' : '#1a202c'};
    font-size: 14px;
    font-weight: 400;
    transition: all 0.2s ease;
    
    &:hover {
      border-color: ${({ $theme, error }) => 
        error 
          ? '#ef4444' 
          : $theme === 'dark' ? '#718096' : '#cbd5e0'};
    }
    
    &:focus,
    &.ant-input-focused {
      border-color: #e87e4f;
      box-shadow: 0 0 0 3px rgba(232, 126, 79, 0.1);
      outline: none;
    }
    
    &::placeholder {
      color: ${({ $theme }) => $theme === 'dark' ? '#a0aec0' : '#718096'};
    }
  }
`;

const StyledSearchInput = styled(AntInput.Search)<{ $theme: string; error?: boolean }>`
  .ant-input {
    height: 48px;
    border-radius: 12px 0 0 12px;
    border: 2px solid ${({ $theme, error }) => 
      error 
        ? '#ef4444' 
        : $theme === 'dark' ? '#4a5568' : '#e2e8f0'};
    border-right: none;
    background: ${({ $theme }) => $theme === 'dark' ? '#2d3748' : '#ffffff'};
    color: ${({ $theme }) => $theme === 'dark' ? '#ffffff' : '#1a202c'};
    font-size: 14px;
    font-weight: 400;
    transition: all 0.2s ease;
    
    &:hover {
      border-color: ${({ $theme, error }) => 
        error 
          ? '#ef4444' 
          : $theme === 'dark' ? '#718096' : '#cbd5e0'};
    }
    
    &:focus,
    &.ant-input-focused {
      border-color: #e87e4f;
      box-shadow: 0 0 0 3px rgba(232, 126, 79, 0.1);
      outline: none;
    }
    
    &::placeholder {
      color: ${({ $theme }) => $theme === 'dark' ? '#a0aec0' : '#718096'};
    }
  }
  
  .ant-input-search-button {
    height: 48px;
    border-radius: 0 12px 12px 0;
    border: 2px solid ${({ $theme, error }) => 
      error 
        ? '#ef4444' 
        : $theme === 'dark' ? '#4a5568' : '#e2e8f0'};
    border-left: none;
    background: ${({ $theme }) => $theme === 'dark' ? '#4a5568' : '#f7fafc'};
    color: ${({ $theme }) => $theme === 'dark' ? '#ffffff' : '#1a202c'};
    font-weight: 600;
    transition: all 0.2s ease;
    
    &:hover {
      background: ${({ $theme }) => $theme === 'dark' ? '#718096' : '#edf2f7'};
      border-color: ${({ $theme, error }) => 
        error 
          ? '#ef4444' 
          : $theme === 'dark' ? '#718096' : '#cbd5e0'};
    }
  }
`;

const Input: React.FC<CustomInputProps> = ({
  error,
  type = 'text',
  multiline = false,
  rows = 4,
  className,
  onSearch,
  loading,
  enterButton,
  prefix: _prefix,
  onChange,
  ...props
}) => {
  const { theme } = useTheme();

  if (onSearch) {
    return (
      <StyledSearchInput
        $theme={theme}
        error={error}
        {...props}
        onSearch={onSearch}
        loading={loading}
        enterButton={enterButton}
        className={`${className || ''} ${error ? 'error' : ''}`}
        onChange={onChange}
      />
    );
  }

  if (multiline) {
    return (
      <TextAreaStyles $theme={theme} error={error}>
        <AntInput.TextArea
          rows={rows}
          className={`${className || ''} ${error ? 'error' : ''}`}
          onChange={e => onChange?.(e as any)}
          allowClear={false}
          showCount={false}
          count={undefined}
          onClear={undefined}
        />
      </TextAreaStyles>
    );
  }

  if (type === 'password') {
    return (
      <StyledInput
        $theme={theme}
        error={error}
        type="password"
        {...props}
        className={`${className || ''} ${error ? 'error' : ''}`}
        onChange={onChange}
      />
    );
  }

  return (
    <StyledInput
      $theme={theme}
      error={error}
      type={type}
      {...props}
      className={`${className || ''} ${error ? 'error' : ''}`}
      onChange={onChange}
    />
  );
};

export default Input;