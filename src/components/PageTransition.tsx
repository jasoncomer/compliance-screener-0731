import React, { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
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
    transform: translateY(-20px);
  }
`;

const TransitionContainer = styled.div<{ $isExiting: boolean }>`
  animation: ${({ $isExiting }) => $isExiting ? fadeOut : fadeIn} 0.4s ease-in-out;
  width: 100%;
  height: 100%;
`;

interface PageTransitionProps {
  children: React.ReactNode;
  isExiting?: boolean;
}

const PageTransition: React.FC<PageTransitionProps> = ({ children, isExiting = false }) => {
  const [shouldRender, setShouldRender] = useState(true);

  useEffect(() => {
    if (isExiting) {
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 400); // Match animation duration
      return () => clearTimeout(timer);
    } else {
      setShouldRender(true);
    }
  }, [isExiting]);

  if (!shouldRender) return null;

  return (
    <TransitionContainer $isExiting={isExiting}>
      {children}
    </TransitionContainer>
  );
};

export default PageTransition;
