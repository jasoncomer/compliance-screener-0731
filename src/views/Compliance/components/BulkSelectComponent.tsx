import React, { useState } from 'react';

import { UserOutlined } from '@ant-design/icons';
import { Button, Card, Col, message,Modal, Row, Select, Space } from 'antd';

import { useBulkUpdateTransactionAssignee } from '../../../hooks/useComplianceTransactions';
import { useAppSelector } from '../../../store/hooks';
import { selectActiveOrgMembers } from '../../../store/slices/organizationsSlice';
import { EMemberStatus } from '../../../typings/organization';
import { getUserDisplayName } from '../../../utils/display-labels';

interface BulkSelectComponentProps {
  selectedRowKeys: React.Key[];
  onClearSelection: () => void;
  onBulkActionComplete?: () => void;
}

const BulkSelectComponent: React.FC<BulkSelectComponentProps> = ({
  selectedRowKeys,
  onClearSelection,
  onBulkActionComplete
}) => {
  const organizationMembers = useAppSelector(selectActiveOrgMembers);
  const bulkUpdateMutation = useBulkUpdateTransactionAssignee();
  
  const [assignModalVisible, setAssignModalVisible] = useState<boolean>(false);
  const [selectedReviewer, setSelectedReviewer] = useState<string | null>(null);

  const openBulkAssignModal = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('Please select at least one transaction to assign');
      return;
    }
    setAssignModalVisible(true);
  };

  const closeBulkAssignModal = () => {
    setAssignModalVisible(false);
    setSelectedReviewer(null);
  };

  const handleBulkAssign = async () => {
    if (!selectedReviewer) {
      message.warning('Please select a reviewer to assign these transactions');
      return;
    }

    const transactionIds = selectedRowKeys.map(key => String(key));
    
    bulkUpdateMutation.mutate(
      {
        transactionIds,
        assignee: selectedReviewer
      },
      {
        onSuccess: () => {
          message.success(`Successfully assigned ${transactionIds.length} transaction(s) for review`);
          onClearSelection();
          closeBulkAssignModal();
          if (onBulkActionComplete) {
            onBulkActionComplete();
          }
        },
        onError: (error) => {
          console.error('Error assigning transactions:', error);
          message.error('Failed to assign transactions');
          if (onBulkActionComplete) {
            onBulkActionComplete();
          }
        }
      }
    );
  };

  if (selectedRowKeys.length === 0) {
    return null;
  }

  return (
    <>
      <Card 
        style={{ marginBottom: 16 }}
        size="small"
      >
        <Row align="middle" justify="space-between">
          <Col>
            <span>{selectedRowKeys.length} transaction(s) selected</span>
          </Col>
          <Col>
            <Space>
              <Button 
                type="primary"
                icon={<UserOutlined />}
                onClick={openBulkAssignModal}
              >
                Assign
              </Button>
              <Button 
                danger
                onClick={onClearSelection}
              >
                Clear Selection
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Modal
        title="Assign Transactions"
        open={assignModalVisible}
        onCancel={closeBulkAssignModal}
        footer={[
          <Button key="cancel" onClick={closeBulkAssignModal}>
            Cancel
          </Button>,
          <Button 
            key="assign" 
            type="primary" 
            loading={bulkUpdateMutation.isPending}
            disabled={!selectedReviewer}
            onClick={handleBulkAssign}
          >
            Assign
          </Button>,
        ]}
      >
        <p>Select a team member to assign {selectedRowKeys.length} transaction(s) for review:</p>
        <Select
          style={{ width: '100%' }}
          placeholder="Select a reviewer"
          value={selectedReviewer}
          onChange={(value) => setSelectedReviewer(value)}
          suffixIcon={<UserOutlined />}
        >
          {(organizationMembers || []).map(member => {
            const isDisabled = member.status === EMemberStatus.PENDING;
            return (
              <Select.Option key={member.userId} value={member.userId} disabled={isDisabled}>
                {getUserDisplayName(member)}
              </Select.Option>
            );
          })}
        </Select>
      </Modal>
    </>
  );
};

export default BulkSelectComponent;