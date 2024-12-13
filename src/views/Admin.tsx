import { FC, useState, useEffect } from 'react'
import styled from 'styled-components';
import { FiInfo } from 'react-icons/fi';
import { Modal, message, Table, Tag } from 'antd';
import { sot } from '../api/sot';
import type { ISOTSyncLog } from '../typings/SOT';

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

const JobHistory = styled.div`
  margin-top: 24px;
`;

const Admin: FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobHistory, setJobHistory] = useState<ISOTSyncLog[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const loadJobHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const data = await sot.loadLastUpdate();
      setJobHistory(Array.isArray(data) ? data.slice(0, 5) : [data]);
    } catch (err) {
      console.error('Failed to load job history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadJobHistory();
  }, []);

  const columns = [
    {
      title: 'Job Time',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (time: string) => time ? new Date(time).toLocaleString() : '-',
    },
    {
      title: 'Status',
      dataIndex: 'success',
      key: 'success',
      render: (status: boolean) => {
        let color = 'default';
        if (status) color = 'success';
        if (!status) color = 'error';
        return <Tag color={color}>{status ? 'Success' : 'Failed'}</Tag>;
      },
    },
    {
      title: 'Records Updated',
      dataIndex: 'count',
      key: 'count',
      render: (count: number) => count || '-',
    },
    {
      title: 'Error',
      dataIndex: 'error',
      key: 'error',
      render: (error: string) => error || '-',
    },
  ];

  const triggerJob = async () => {
    setIsLoading(true);
    setError(null);
    
    const loadingMessage = message.loading('Updating MongoDB with latest Source of Truth data...', 0);
    
    try {
      const response = await sot.updateMongoDb();
      message.success('Job completed successfully');
      loadJobHistory(); // Reload history after successful job
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to trigger job');
      message.error('Failed to update MongoDB');
    } finally {
      loadingMessage();
      setIsLoading(false);
    }
  };

  const handleTriggerJob = () => {
    Modal.confirm({
      title: 'Confirm Job Execution',
      content: 'Are you sure you want to update the MongoDB database with the latest Source of Truth data? This operation may take several minutes.',
      okText: 'Yes, Run Job',
      cancelText: 'Cancel',
      onOk: triggerJob,
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
              This job updates the MongoDB database with the latest Source of Truth data. It synchronizes all collections and ensures data consistency across the system.
            </Tooltip>
          </InfoIcon>
        </ButtonGroup>
        
        {error && (
          <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>
        )}

        <JobHistory>
          <h3>Recent Job History</h3>
          <Table
            dataSource={jobHistory}
            columns={columns}
            loading={isLoadingHistory}
            rowKey={(record) => record._id}
            pagination={false}
            size="small"
          />
        </JobHistory>
      </div>
    </Container>
  );
};

export default Admin
