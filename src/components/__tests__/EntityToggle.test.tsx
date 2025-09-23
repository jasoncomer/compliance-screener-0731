import { fireEvent,render, screen } from '@testing-library/react';

import '@testing-library/jest-dom';

import EntityToggle from '../EntityToggle';

// Mock the theme context
jest.mock('../context/ThemeContext', () => ({
  useTheme: () => ({ theme: 'light' })
}));

describe('EntityToggle', () => {
  const defaultProps = {
    isBeneficialOwner: false,
    onToggle: jest.fn(),
    custodialEntityName: 'Custodial Entity',
    beneficialOwnerName: 'Beneficial Owner'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with correct initial state', () => {
    render(<EntityToggle {...defaultProps} />);
    
    expect(screen.getByText('Viewing: Custodial Entity')).toBeInTheDocument();
    expect(screen.getByText('Showing custodial entity information')).toBeInTheDocument();
    expect(screen.getByText('Custodial Entity')).toBeInTheDocument();
    expect(screen.getByText('Beneficial Owner')).toBeInTheDocument();
  });

  it('renders beneficial owner state correctly', () => {
    render(<EntityToggle {...defaultProps} isBeneficialOwner={true} />);
    
    expect(screen.getByText('Viewing: Beneficial Owner')).toBeInTheDocument();
    expect(screen.getByText('Showing beneficial owner information')).toBeInTheDocument();
  });

  it('calls onToggle when switch is clicked', () => {
    const onToggle = jest.fn();
    render(<EntityToggle {...defaultProps} onToggle={onToggle} />);
    
    const switchElement = screen.getByRole('switch');
    fireEvent.click(switchElement);
    
    expect(onToggle).toHaveBeenCalledWith(true);
  });

  it('disables switch when disabled prop is true', () => {
    render(<EntityToggle {...defaultProps} disabled={true} />);
    
    const switchElement = screen.getByRole('switch');
    expect(switchElement).toBeDisabled();
  });

  it('uses custom entity names', () => {
    render(
      <EntityToggle 
        {...defaultProps} 
        custodialEntityName="Custom Custodial"
        beneficialOwnerName="Custom Beneficial"
      />
    );
    
    expect(screen.getByText('Viewing: Custom Custodial')).toBeInTheDocument();
    expect(screen.getByText('Custom Custodial')).toBeInTheDocument();
    expect(screen.getByText('Custom Beneficial')).toBeInTheDocument();
  });
});