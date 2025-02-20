import React from 'react';
import { Input as AntInput, InputProps as AntInputProps } from 'antd';
import { TextAreaProps } from 'antd/es/input';
import { SizeType } from 'antd/es/config-provider/SizeContext';
import { SearchProps } from 'antd/es/input';

export interface CustomInputProps extends Omit<AntInputProps, 'size'> {
  error?: boolean;
  multiline?: boolean;
  rows?: number;
  size?: SizeType;
  onSearch?: (value: string) => void;
  loading?: boolean;
  enterButton?: boolean | React.ReactNode;
}

const Input: React.FC<CustomInputProps> = ({
  error,
  type = 'text',
  multiline = false,
  rows = 4,
  className,
  size = 'middle',
  onSearch,
  loading,
  enterButton,
  ...props
}) => {
  const inputProps = {
    ...props,
    size,
    className: `${className || ''} ${error ? 'error' : ''}`,
  };

  if (onSearch) {
    return (
      <AntInput.Search
        {...(inputProps as SearchProps)}
        onSearch={onSearch}
        loading={loading}
        enterButton={enterButton}
      />
    );
  }

  if (multiline) {
    return <AntInput.TextArea rows={rows} {...(inputProps as TextAreaProps)} />;
  }

  if (type === 'password') {
    return <AntInput.Password {...inputProps} />;
  }

  return <AntInput type={type} {...inputProps} />;
};

export default Input; 