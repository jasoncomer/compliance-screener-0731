import React, { useEffect, useState } from 'react';
import { Timeline, Card, Spin, Alert, Typography, Tag, Tooltip } from 'antd';
import { format } from 'date-fns';
import {
  EditOutlined,
  PlusOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
  TagOutlined,
  CheckCircleOutlined,
  StopOutlined,
  ClockCircleOutlined,
  LockOutlined,
  InboxOutlined
} from '@ant-design/icons';
import { compliance } from '../../api/compliance';
import { MonitoredAddressChange } from '../../typings/compliance';

const { Title, Text } = Typography;

interface AddressChangeHistoryProps {
  addressId: string;
  organizationId?: string;
  refreshKey?: number;
}

const AddressChangeHistory: React.FC<AddressChangeHistoryProps> = ({ addressId, organizationId, refreshKey }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<MonitoredAddressChange[]>([]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const response = await compliance.getAddressChangeHistory(addressId);
        console.log('response', response);
        setHistory(response);
        setError(null);
      } catch (err) {
        console.error('Error fetching address history:', err);
        setError('Failed to load address history. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (addressId) {
      fetchHistory();
    }
  }, [addressId, organizationId, refreshKey]);

  const getChangeIcon = (changeType: string, field?: string, newValue?: any) => {
    if (changeType === 'create') return <PlusOutlined style={{ color: '#52c41a' }} />;
    if (changeType === 'delete') return <DeleteOutlined style={{ color: '#f5222d' }} />;

    // For update changes
    if (field === 'tags') return <TagOutlined style={{ color: '#1890ff' }} />;
    if (field === 'status') {
      if (newValue === 'active') return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      if (newValue === 'inactive') return <StopOutlined style={{ color: '#f5222d' }} />;
      if (newValue === 'pending_review') return <ClockCircleOutlined style={{ color: '#faad14' }} />;
      if (newValue === 'suspended') return <LockOutlined style={{ color: '#f5222d' }} />;
      if (newValue === 'archived') return <InboxOutlined style={{ color: '#8c8c8c' }} />;
    }

    return <EditOutlined style={{ color: '#1890ff' }} />;
  };

  const formatValue = (value?: string, field?: string) => {
    if (!value) return 'N/A';

    if (field === 'tags') {
      try {
        const tags = JSON.parse(value);
        return tags.length > 0
          ? tags.map((tag: string) => <Tag key={tag}>{tag}</Tag>)
          : 'No tags';
      } catch {
        return value;
      }
    }

    if (field === 'status') {
      const statusColors: Record<string, string> = {
        active: 'green',
        inactive: 'red',
        pending_review: 'orange',
        suspended: 'volcano',
        archived: 'gray'
      };

      return <Tag color={statusColors[value]}>{value.replace('_', ' ')}</Tag>;
    }

    return value;
  };

  const getChangeTitle = (item: MonitoredAddressChange) => {
    if (item.changeType === 'create') {
      return 'Address added to monitoring';
    }

    if (item.changeType === 'delete') {
      return 'Address removed from monitoring';
    }

    if (item.changeType === 'update' && item.newValue !== undefined) {
      const fieldName = item.fieldName;
      return `${fieldName} updated`;
    }

    return 'Address updated';
  };

  const getUserName = (changedById: any) => {
    if (typeof changedById === 'object' && changedById !== null) {
      return changedById.name || changedById.email || 'Unknown user';
    }
    return changedById || 'Unknown user';
  };

  if (loading) {
    return <Spin tip="Loading history..." />;
  }

  if (error) {
    return <Alert message="Error" description={error} type="error" showIcon />;
  }

  if (history.length === 0) {
    return <Alert message="No history found for this address" type="info" showIcon />;
  }

  return (
    <Card>
      <Title level={4}>Address Change History</Title>
      <Timeline>
        {history.map(item => {
          return (
            <Timeline.Item
              key={item._id}
              dot={getChangeIcon(item.changeType, item.fieldName, item.newValue)}
            >
              <div style={{ marginBottom: '8px' }}>
                <Text strong className="capitalize">{getChangeTitle(item)}</Text>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <Text>{item.newValue}</Text>
                  <Text type="secondary">
                    {format(new Date(item.timestamp), 'MMM d, yyyy h:mm a')} by {getUserName(item.changedById)}
                  </Text>
                </div>
              </div>

              {item.changeType === 'update' && Object.keys(item.newValue || {}).length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {/* <div>
                  <Text type="secondary">From: </Text>
                  {formatValue(item.oldValue, Object.keys(item.newValue || {})[0])}
                </div>
                <div>
                  <Text type="secondary">To: </Text>
                  {formatValue(item.newValue, Object.keys(item.newValue || {})[0])}
                </div> */}

                  {item.notes && (
                    <div style={{ marginTop: '8px' }}>
                      <Tooltip title={item.notes}>
                        <Tag icon={<InfoCircleOutlined />} color="blue">
                          Reason provided
                        </Tag>
                      </Tooltip>
                      <div style={{ marginTop: '4px', padding: '8px', background: '#f5f5f5', borderRadius: '4px' }}>
                        <Text>{item.notes}</Text>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Timeline.Item>
          );
        })}
      </Timeline>
    </Card>
  );
};

export default AddressChangeHistory; 