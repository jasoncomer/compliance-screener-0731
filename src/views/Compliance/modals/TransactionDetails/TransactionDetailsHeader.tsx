import React, { useState } from 'react';
import { Select, message } from 'antd';
import { InfoCircleOutlined, UserOutlined, LoadingOutlined } from '@ant-design/icons';
import { ETransactionStatus } from '../../../../typings/compliance';
import { IComplianceTransaction } from '../../../../typings/compliance';
import { selectActiveOrgMembers } from '../../../../store/slices/organizationsSlice';
import { useAppSelector, useAppDispatch } from '../../../../store/hooks';
import { EMemberStatus, IOrganizationMember } from '../../../../typings/organization';
import { getUserDisplayName } from '../../../../utils/display-labels';
import { updateTransactionAssignee, updateTransactionStatus } from '../../../../store/slices/complianceTransactionsSlice';

interface TransactionDetailsHeaderProps {
  transactionDetails: IComplianceTransaction;
}

const TransactionDetailsHeader: React.FC<TransactionDetailsHeaderProps> = ({
  transactionDetails,
}) => {
  const dispatch = useAppDispatch();
  const organizationMembers = useAppSelector(selectActiveOrgMembers);

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [assigningUser, setAssigningUser] = useState(false);
  
  if (!transactionDetails || !organizationMembers) return null;

  const handleAssignTransaction = async (userId: any) => {
    try {
      setAssigningUser(true);
      
      // Assign to selected member
      await dispatch(updateTransactionAssignee({
        transactionId: transactionDetails._id,
        assignee: userId
      })).unwrap();

      // Update status to assigned (in review) via Redux
      await dispatch(updateTransactionStatus({ 
        transactionId: transactionDetails._id, 
        status: ETransactionStatus.IN_REVIEW 
      })).unwrap();

      message.success('Transaction assigned successfully');
      // Clear selection after successful assignment
      setSelectedUserId(null);
    } catch (error) {
      console.error('Failed to assign transaction:', error);
      message.error('Failed to assign transaction');
    } finally {
      setAssigningUser(false);
    }
  };

  return (
    <>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', flexDirection: 'row' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 600, margin: 'auto 5px' }}>Transaction Details</h2>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'flex-end',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <Select
            style={{ width: 230 }}
            size="middle"
            placeholder="Assign to..."
            value={selectedUserId}
            loading={assigningUser}
            disabled={assigningUser}
            dropdownRender={(menu) => (
              <div>
                <div style={{ padding: '8px 8px 0' }}>
                  <span style={{ fontWeight: 500 }}>Team Members</span>
                </div>
                {menu}
                <div style={{
                  padding: '4px 8px 8px',
                  color: '#8c8c8c',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <InfoCircleOutlined />
                  Status changes to 'Assigned'
                </div>
              </div>
            )}
            onSelect={handleAssignTransaction}
            suffixIcon={assigningUser ? <LoadingOutlined /> : <UserOutlined />}
          >
            {organizationMembers.map(member => {
              const isDisabled = member.status === EMemberStatus.REMOVED || member.status === EMemberStatus.PENDING;
              return (
                <Select.Option key={member.userId} value={member.userId} disabled={isDisabled} className="capitalize">
                  {getUserDisplayName(member as IOrganizationMember)}
                </Select.Option>
              )
            })}
          </Select>
        </div>
      </div>
    </>
  );
};

export default TransactionDetailsHeader;
