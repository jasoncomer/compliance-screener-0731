import { RadarChartOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import React from 'react';
import styled from 'styled-components';

const GraphButtonsWrapper = styled.div`
  position: absolute;
  top: 200px;
  left: 15px;
  z-index: 9;
  display: flex;
  transition: all 0.5s;

  .anticon {
    cursor: pointer;
  }

  .buttons-container {
    display: flex;
    flex-direction: column;
    gap: 5px;
    padding: 5px;
    background: white;
    border-radius: 5px;
  }
`;

interface Props {
  onClick?: () => void;
}

const GraphButtons: React.FC<Props> = ({ onClick }) => {
  // const [isHovered, setIsHovered] = useState(false);

  // const handleMouseEnter = () => {
  //   setIsHovered(true);
  // };

  // const handleMouseLeave = () => {
  //   setIsHovered(false);
  // };

  return (
    <GraphButtonsWrapper
      className="graph-buttons"
      // onMouseEnter={handleMouseEnter}
      // onMouseLeave={handleMouseLeave}
    >
      <Button
        type="primary"
        shape="circle"
        size='large'
        icon={<RadarChartOutlined />}
        onClick={onClick}
      />

      {/* {isHovered && (
        <div className="buttons-container">
          <button>Button 1</button>
          <button>Button 2</button>
          <button>Button 3</button>
          <button>Button 4</button>
        </div>
      )} */}
    </GraphButtonsWrapper>
  );
};

export default GraphButtons;