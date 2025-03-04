import React from 'react';
import { OptionCardProps } from '../types';
import { OptionCard as StyledOptionCard } from '../styled';

const OptionCard: React.FC<OptionCardProps> = ({
  selected,
  onClick,
  icon,
  title,
  description,
  theme
}) => {
  return (
    <StyledOptionCard
      selected={selected}
      onClick={onClick}
      theme={theme}
    >
      <h3>
        {icon} {title}
      </h3>
      <p>{description}</p>
    </StyledOptionCard>
  );
};

export default OptionCard; 