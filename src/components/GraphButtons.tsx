import React from 'react';
import { Button } from '@/components/ui/button';
import { Radar } from 'lucide-react';
import { cn } from '@/lib/utils';


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
    <div
      className={cn(
        "graph-buttons",
        "absolute top-[200px] left-[15px] z-[9] flex transition-all duration-500"
      )}
      // onMouseEnter={handleMouseEnter}
      // onMouseLeave={handleMouseLeave}
    >
      <Button
        variant="default"
        size="icon"
        className="h-12 w-12 rounded-full"
        onClick={onClick}
      >
        <Radar className="h-6 w-6" />
      </Button>

      {/* {isHovered && (
        <div className="buttons-container flex flex-col gap-[5px] p-[5px] bg-white rounded-[5px]">
          <button>Button 1</button>
          <button>Button 2</button>
          <button>Button 3</button>
          <button>Button 4</button>
        </div>
      )} */}
    </div>
  );
};

export default GraphButtons;