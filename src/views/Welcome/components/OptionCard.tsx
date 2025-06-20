import React from 'react';
import { OptionCardProps } from '../types';
import { OptionCard as StyledOptionCard } from '../WelcomeStyles';

const OptionCard: React.FC<OptionCardProps> = ({
  selected,
  onClick,
  icon,
  title,
  description
}) => {
  return (
    <StyledOptionCard
      selected={selected}
      onClick={onClick}
    >
      <h3>
        {icon} {title}
      </h3>
      <p>{description}</p>
    </StyledOptionCard>
  );
};

export default OptionCard; 