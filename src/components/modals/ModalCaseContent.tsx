import React from 'react';
import { Modal, Typography } from 'antd';
import { ICase } from '../../typings/interfaces';
import styled from 'styled-components';

const { Title, Text } = Typography;

interface ModalCaseContentProps {
  userCase: ICase;
  open: boolean;
  close: () => void;
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
`;

const GridContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
`;

const InfoSection = styled.div`
  background-color: #f5f5f5;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
`;

const Label = styled(Text)`
  font-weight: bold;
  margin-right: 8px;
`;

const Value = styled(Text)`
  color: #1890ff;
`;

const AddressList = styled.ul`
  list-style-type: none;
  padding-left: 0;
  margin: 0;
`;

const ModalCaseContent: React.FC<ModalCaseContentProps> = ({ userCase, open, close }) => {
  const { addresses: addressesString, caseId, clientEmail, clientName, status, userId, blockchain, notes } = userCase;
  const addresses = Array.isArray(addressesString) ? addressesString.join(',') : addressesString;

  return (
    <Modal
      title={<Title level={3}>{`Case Details: ${caseId.toUpperCase()}`}</Title>}
      centered
      open={open}
      onOk={() => close()}
      onCancel={() => close()}
      width={1000}
    >
      <Wrapper>
        <GridContainer>
          <InfoSection>
            <Title level={4}>Client Information</Title>
            <p><Label>Name:</Label><Value>{clientName}</Value></p>
            <p><Label>Email:</Label><Value>{clientEmail}</Value></p>
            <p><Label>Blockchain:</Label><Value>{blockchain}</Value></p>
          </InfoSection>
          <InfoSection>
            <Title level={4}>Case Details</Title>
            <p><Label>Status:</Label><Value>{status}</Value></p>
            <p><Label>User ID:</Label><Value>{userId}</Value></p>
          </InfoSection>
        </GridContainer>
        <InfoSection>
          <Title level={4}>Notes</Title>
          <Text>{notes}</Text>
        </InfoSection>
        <InfoSection>
          <Title level={4}>Addresses</Title>
          <AddressList>
            {addresses.split(',').map((address, index) => (
              <li key={index}><Value>{address.trim()}</Value></li>
            ))}
          </AddressList>
        </InfoSection>
      </Wrapper>
    </Modal>
  );
};

export default ModalCaseContent;