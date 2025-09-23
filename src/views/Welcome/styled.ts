import styled, { css, keyframes } from 'styled-components';

import { colors } from '@/design-system/tokens'

const transitionLength = '0.5s';

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const fadeOut = keyframes`
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(-10px);
  }
`;

// StyledCard is now a div styled to look like a card
export const StyledCard = styled.div`
  max-width: 800px;
  width: fit-content;
  margin: auto;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  padding: 32px;

  &.form-view {
    max-width: 600px;
    width: 100%;
  }
`;

export const WelcomeContainer = styled.div<{ theme: { theme: 'dark' | 'light' } }>`
  width: 100%;
  min-height: calc(100vh - 64px); // Account for header
  display: flex;
  flex-direction: column;
  align-items: center;
  background: ${props => props.theme.theme === 'dark' ? '#141414' : '#fff'};
`;

export const ContentWrapper = styled.div<{ state: 'entering' | 'exiting' | 'stable' }>`
  min-height: 100px;
  opacity: ${props => props.state === 'stable' ? 1 : props.state === 'exiting' ? 1 : 0};
  visibility: visible;
  animation: ${props => {
    switch (props.state) {
      case 'entering':
        return css`${fadeIn} ${transitionLength} cubic-bezier(0.3, 0, 0.7, 1)`;
      case 'exiting':
        return css`${fadeOut} ${transitionLength} cubic-bezier(0.3, 0, 0.7, 1)`;
      default:
        return 'none';
    }
  }};
  animation-fill-mode: forwards;
`;

export const WelcomeHeader = styled.div`
  text-align: center;
  margin-bottom: 32px;

  img {
    width: 180px;
    margin-bottom: 24px;
  }

  h2 {
    font-size: 32px;
    margin: 0 0 16px 0;
    font-weight: 600;
    color: ${colors.brand.primary};
  }

  p {
    font-size: 16px;
    color: ${props => props.theme.theme === 'dark' ? '#a0a0a0' : '#666'};
    margin: 0;
    line-height: 1.6;
  }
`;

export const ActionButtons = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 32px;

  .ant-btn {
    height: 40px;
    padding: 6.4px 15px;
    font-size: 16px;
    border-radius: 6px;

    &.ant-btn-lg {
      height: 40px;
      padding: 6.4px 24px;
    }
  }
`;

export const OptionCard = styled.div<{ selected?: boolean; theme: 'dark' | 'light' }>`
  padding: 32px;
  border: 2px solid ${props => props.selected
    ? props.theme === 'dark' ? colors.brand.primary : colors.brand.primaryDark
    : props.theme === 'dark' ? '#2d2d2d' : '#e0e0e0'
  };
  border-radius: 12px;
  cursor: pointer;
  transition: all ${transitionLength} cubic-bezier(0.4, 0, 0.2, 1);
  margin-bottom: 24px;
  background: ${props => props.theme === 'dark' ? '#1f1f1f' : 'white'};

  &:hover {
    border-color: ${props => props.theme === 'dark' ? colors.brand.primary : colors.brand.primaryDark};
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  h3 {
    color: ${props => props.theme === 'dark' ? '#ffffff' : '#2c3e50'};
    margin: 0;
    font-size: 20px;
    display: flex;
    align-items: center;
    gap: 16px;

    .anticon {
      font-size: 24px;
      color: ${props => props.theme === 'dark' ? colors.brand.primary : colors.brand.primaryDark};
    }
  }

  p {
    color: ${props => props.theme === 'dark' ? '#a0a0a0' : '#7f8c8d'};
    margin: 16px 0 0 0;
    font-size: 15px;
    line-height: 1.6;
  }
`;

export const LoadingWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px;
  gap: 16px;
`;

export const FormContainer = styled.div`
  width: 100%;

  .ant-btn-link {
    margin: -8px 0 24px -8px;
    padding: 8px;
    color: ${props => props.theme.theme === 'dark' ? colors.brand.primary : colors.brand.primaryDark};
    transition: all ${transitionLength} ease;
    border-radius: 6px;

    &:hover {
      color: ${props => props.theme.theme === 'dark' ? colors.brand.primaryDark : colors.brand.primary};
      background: ${props => props.theme.theme === 'dark' 
        ? `${colors.brand.primary}15` 
        : `${colors.brand.primaryDark}15`
      };
    }
  }

  .ant-form-item-label > label {
    font-size: 15px;
    font-weight: 500;
  }

  .ant-form-item {
    margin-bottom: 24px;
  }

  .ant-input {
    padding: 8px 12px;
    font-size: 15px;
  }
`; 