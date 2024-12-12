import { FC, useState } from 'react'
import styled from 'styled-components';
import { FiInfo } from 'react-icons/fi';
import { Modal, message } from 'antd';
import { api } from '../api/api';

const Container = styled.div`
  padding: 20px;
`;

const Button = styled.button`
  padding: 10px 20px;
  background-color: #3b82f6;
  color: white;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  
  &:disabled {
    background-color: #9ca3af;
    cursor: not-allowed;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const InfoIcon = styled.div`
  position: relative;
  display: inline-flex;
  align-items: center;
  color: #6b7280;
  cursor: help;

  &:hover .tooltip {
    visibility: visible;
    opacity: 1;
  }
`;

const Tooltip = styled.div`
  visibility: hidden;
  position: absolute;
  left: 100%;
  margin-left: 8px;
  background-color: #1f2937;
  color: white;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 14px;
  width: 200px;
  opacity: 0;
  transition: opacity 0.2s;
  z-index: 1000;
`;

const Admin: FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const triggerJob = async () => {
    setIsLoading(true);
    setError(null);
    
    const loadingMessage = message.loading('Updating MongoDB with latest Source of Truth data...', 0);
    
    try {
      const response = await api.sot.updateMongoDb();
      if (!response.success) {
        throw new Error('Failed to trigger job');
      }
      message.success(`Job completed successfully: added ${response.count} records`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to trigger job');
      message.error('Failed to update MongoDB');
    } finally {
      loadingMessage(); // Destroy loading message
      setIsLoading(false);
    }
  };

  const handleTriggerJob = () => {
    Modal.confirm({
      title: 'Confirm Job Execution',
      content: 'Are you sure you want to update the MongoDB database with the latest Source of Truth data? This operation may take several minutes.',
      okText: 'Yes, Run Job',
      cancelText: 'Cancel',
      onOk: () => {
        Modal.destroyAll(); // Dismiss modal before starting job
        triggerJob();
      },
      okButtonProps: { type: 'primary' },
      centered: true,
    });
  };

return (
  <Container>
    <h2>Admin Dashboard</h2>
    <div>
      <ButtonGroup>
        <Button
          onClick={handleTriggerJob}
          disabled={isLoading}
        >
          {isLoading ? 'Running...' : 'SOT: Update MongoDb'}
        </Button>
        <InfoIcon>
          <FiInfo size={16} />
          <Tooltip className="tooltip">
            This job updates the MongoDB database with the latest Source of Truth data. It deletes the previous data and uploads the new data.
          </Tooltip>
        </InfoIcon>
      </ButtonGroup>

      {error && (
        <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>
      )}
    </div>
  </Container>
)
}

export default Admin
