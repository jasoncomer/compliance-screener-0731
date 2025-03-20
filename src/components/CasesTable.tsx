import { TableProps, Tag, Table, Button as AntButton, Tabs as AntTabs, Space, Dropdown, MenuProps, message } from 'antd';
import { ICase } from '../typings/interfaces';
import { FC, useState } from 'react';
import styled from 'styled-components';
import { ECaseStatus, ECaseStatusDisplayNames, ECaseStatusColors } from '../typings/enums';
import { truncateAddress } from '../utils/crypto';
import DeleteCaseButton from './DeleteCaseButton';
import ModalCaseContent from './modals/ModalCaseContent';
import { api } from '../api/api';
import { ArrowRightOutlined } from '@ant-design/icons';

const Tabs = styled(AntTabs)`
  .ant-tabs-nav {
    margin-bottom: 0;
  }
`;

const Button = styled(AntButton)`
  box-shadow: none;
  margin-bottom: 5px;
  height: 32px;
`;

interface Props {
  cases: ICase[];
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  refreshCases?: () => void;
}

// Define the status flow - which statuses can be transitioned to from each status
const statusTransitions: Record<ECaseStatus, ECaseStatus[]> = {
  [ECaseStatus.NEW]: [ECaseStatus.UNDER_REVIEW, ECaseStatus.PENDING_INFO, ECaseStatus.CLOSED],
  [ECaseStatus.UNDER_REVIEW]: [ECaseStatus.ESCALATED, ECaseStatus.PENDING_INFO, ECaseStatus.CLOSED],
  [ECaseStatus.ESCALATED]: [ECaseStatus.UNDER_REVIEW, ECaseStatus.PENDING_INFO, ECaseStatus.CLOSED],
  [ECaseStatus.PENDING_INFO]: [ECaseStatus.UNDER_REVIEW, ECaseStatus.CLOSED],
  [ECaseStatus.CLOSED]: [ECaseStatus.ARCHIVED],
  [ECaseStatus.ARCHIVED]: [],
};

const CardTabItems = [
  {
    label: 'New',
    key: 'new',
  },
  {
    label: 'Under Review',
    key: 'under_review',
  },
  {
    label: 'Escalated',
    key: 'escalated',
  },
  {
    label: 'Pending Info',
    key: 'pending_info',
  },
  {
    label: 'Closed',
    key: 'closed',
  },
  {
    label: 'Archived',
    key: 'archived',
  },
];

const CasesTable: FC<Props> = ({ cases, setIsModalOpen, refreshCases }) => {
  const [selectedCase, setSelectedCase] = useState<ICase>();
  const [activeTab, setActiveTab] = useState<string>('new');
  const [loading, setLoading] = useState<boolean>(false);

  const selectCase = (caseId: string) => {
    const selected = cases.find((c) => c.caseId === caseId);
    if (selected) {
      setSelectedCase(selected);
    }
  };
  
  const closeModal = () => setSelectedCase(undefined);

  // Function to handle case status change
  const handleStatusChange = async (record: ICase, newStatus: ECaseStatus) => {
    setLoading(true);
    try {
      await api.cases.updateStatus(record._id, newStatus);
      message.success(`Status updated to ${ECaseStatusDisplayNames[newStatus]}`);
      
      // Refresh cases from the parent component
      if (refreshCases) {
        refreshCases();
      } 
      
    } catch (error) {
      console.error('Failed to update case status:', error);
      message.error('Failed to update case status');
    } finally {
      setLoading(false);
    }
  };

  // Prepare the status change dropdown menu for each case
  const getStatusMenu = (record: ICase): MenuProps => {
    const availableTransitions = statusTransitions[record.status as ECaseStatus] || [];
    
    return {
      items: availableTransitions.map(status => ({
        key: status,
        label: (
          <Space>
            <span>{ECaseStatusDisplayNames[status]}</span>
            <ArrowRightOutlined />
          </Space>
        ),
      })),
      onClick: ({ key }) => handleStatusChange(record, key as ECaseStatus),
    };
  };

  const columns: TableProps<ICase>['columns'] = [
    {
      title: 'Case #',
      dataIndex: 'caseId',
      key: 'caseId',
      render: (text) => <a onClick={(e) => {
        e.preventDefault();
        selectCase(text);
      }} >{text}</a>,
    },
    {
      title: 'Client Name',
      dataIndex: 'clientName',
      key: 'clientName',
    },
    {
      title: 'Address',
      dataIndex: 'addresses',
      key: 'addresses',
      render: (addresses) => addresses.map((addr: string) => truncateAddress(addr)).join(', '),
    },
    {
      title: 'Status',
      key: 'status',
      dataIndex: 'status',
      render: (status: ECaseStatus) => {
        const color = ECaseStatusColors[status] || 'default';
        const displayName = ECaseStatusDisplayNames[status] || status;
        
        return (
          <Tag color={color}>
            {displayName}
          </Tag>
        );
      },
    },
    {
      title: 'Last Updated',
      key: 'lastUpdated',
      dataIndex: 'lastUpdated',
      render: (date) => date ? new Date(date).toLocaleString() : 'N/A',
    },
    {
      title: 'Actions',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Dropdown menu={getStatusMenu(record)} disabled={loading}>
            <Button size="small" loading={loading}>
              Change Status
            </Button>
          </Dropdown>
          <DeleteCaseButton caseDoc={record} />
        </Space>
      ),
    },
  ];

  // Handle tab change
  const handleTabChange = (key: string) => {
    setActiveTab(key);
  };

  return (
    <>
      <Tabs
        activeKey={activeTab}
        onChange={handleTabChange}
        type="card"
        size={'large'}
        tabBarExtraContent={<Button type="primary" onClick={() => setIsModalOpen(prev => !prev)}>Add Case</Button>}
        items={CardTabItems.map((item) => {
          // Filter cases by status for each tab
          const filteredCases = cases.filter((c) => c.status === item.key);
          
          return {
            label: `${item.label} (${filteredCases.length})`,
            key: item.key,
            children: (
              <Table<ICase>
                key={item.key}
                columns={columns}
                dataSource={filteredCases}
                rowKey="_id"
                loading={loading}
              />
            )
          }
        })}
      />

      {selectedCase &&
        <ModalCaseContent 
          userCase={selectedCase} 
          open={!!selectedCase} 
          close={closeModal} 
          refreshCases={refreshCases}
        />
      }
    </>
  );
};

export default CasesTable;