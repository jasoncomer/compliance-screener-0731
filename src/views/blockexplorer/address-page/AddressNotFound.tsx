import React from 'react';
import { AlertCircle, Search } from 'lucide-react';
import EmptyState from '../../../components/common/EmptyState';
import { Button } from '../../../components/ui/button';
import { useNavigate } from 'react-router-dom';

interface AddressNotFoundProps {
  address: string;
  redirectTo?: 'block-explorer' | 'risk-dashboard';
  onClearAddress?: () => void;
}

const AddressNotFound: React.FC<AddressNotFoundProps> = ({ address, redirectTo = 'block-explorer', onClearAddress }) => {
  const navigate = useNavigate();

  const handleSearchAgain = () => {
    if (redirectTo === 'risk-dashboard' && onClearAddress) {
      onClearAddress();
    } else {
      navigate('/home/block-explorer');
    }
  };

  return (
    <EmptyState
      variant="error"
      icon={<AlertCircle className="w-12 h-12" />}
      title="Address Not Found"
      description={`The address "${address}" was not found in our database. This could mean the address has never been used in any transactions, or there might be an issue with the address format.`}
      action={
        <Button
          onClick={handleSearchAgain}
          className="flex items-center gap-2"
        >
          <Search className="w-4 h-4" />
          Search Again
        </Button>
      }
    />
  );
};

export default AddressNotFound;
