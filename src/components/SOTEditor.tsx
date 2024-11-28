import React, { useState } from 'react';
import { Card, Form, Input, Button, Space, Typography, Divider, message, Avatar } from 'antd';
import { UserOutlined, GlobalOutlined, TwitterOutlined, SendOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import { SOT } from '../typings/interfaces';
import { api } from '../api/api';
import AssociatedSOTs from './AssociatedSOTs';


const { Title, Text } = Typography;

const Container = styled.div`
  width: 100%;
  display: flex;
  flex-direction: row;
  gap: 24px;
`;

const EditorWrapper = styled(Card)`
  flex: 1;
`;

const ButtonGroup = styled(Space)`
  margin-top: 24px;
`;

const DetailSection = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
  margin-top: 24px;
`;

const DetailItem = styled.div`
  margin-bottom: 16px;
`;

const DetailLabel = styled(Text)`
  display: block;
  color: #666666;
  margin-bottom: 4px;
  font-size: 14px;
  text-align: left;
`;

const DetailValue = styled(Text)`
  font-size: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  
  .anticon {
    color: #1890ff;
  }
  
  a {
    color: #1890ff;
    text-decoration: none;
    &:hover {
      text-decoration: underline;
    }
  }
`;

const HeaderSection = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  text-align: left;
`;

const HeaderInfo = styled.div`
  flex: 1;
  text-transform: capitalize;
`;

const StyledAvatar = styled(Avatar)`
  width: 64px;
  height: 64px;
`;

interface SOTEditorProps {
  sot: SOT | null;
  onSelectAssociatedSot: (sot: SOT) => void;
}

const SOTEditor: React.FC<SOTEditorProps> = ({ sot, onSelectAssociatedSot }) => {
  const [form] = Form.useForm();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!sot) return null;

  const handleEdit = () => {
    setIsEditing(true);
    form.setFieldsValue(sot);
  };

  const handleCancel = () => {
    setIsEditing(false);
    form.resetFields();
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      const updatedSot = await api.blockchain.updateSOT(sot._id, values);
      setIsEditing(false);
      message.success('SOT updated successfully');
    } catch (error) {
      console.error('Failed to update SOT:', error);
      message.error('Failed to update SOT');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      await api.blockchain.deleteSOT(sot._id);
      message.success('SOT deleted successfully');
    } catch (error) {
      console.error('Failed to delete SOT:', error);
      message.error('Failed to delete SOT');
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    if (isEditing) {
      return (
        <Form
          form={form}
          layout="vertical"
          initialValues={sot}
        >
          <Form.Item name="entity_id" label="Entity ID">
            <Input />
          </Form.Item>
          <Form.Item name="proper_name" label="Company Name">
            <Input />
          </Form.Item>
          <Form.Item name="url" label="URL">
            <Input />
          </Form.Item>
          <Form.Item name="entity_type" label="Entity Type">
            <Input />
          </Form.Item>
          <Form.Item name="contact_twitter" label="Twitter">
            <Input />
          </Form.Item>
          <Form.Item name="contact_telegram" label="Telegram">
            <Input />
          </Form.Item>
          <Form.Item name="logo" label="Logo URL">
            <Input />
          </Form.Item>
          <Form.Item name="associate_country_1" label="Country">
            <Input />
          </Form.Item>

          <ButtonGroup>
            <Button onClick={handleCancel}>Cancel</Button>
            <Button type="primary" onClick={handleSave} loading={loading}>
              Save Changes
            </Button>
          </ButtonGroup>
        </Form>
      );
    }

    return (
      <>
        <HeaderSection>
          <StyledAvatar
            src={sot.logo}
            icon={!sot.logo && <UserOutlined />}
          />
          <HeaderInfo>
            <Title level={4} style={{ margin: 0 }}>{sot.proper_name || sot.entity_id}</Title>
            <Text type="secondary">{sot.entity_type}</Text>
          </HeaderInfo>
        </HeaderSection>

        <DetailSection>
          <DetailItem>
            <DetailLabel>Entity ID</DetailLabel>
            <DetailValue>{sot.entity_id}</DetailValue>
          </DetailItem>

          <DetailItem>
            <DetailLabel>Country</DetailLabel>
            <DetailValue>{sot.associate_country_1 || '-'}</DetailValue>
          </DetailItem>

          <DetailItem>
            <DetailLabel>Website</DetailLabel>
            <DetailValue>
              <GlobalOutlined />
              {sot.url ? (
                <a href={sot.url.startsWith('http') ? sot.url : `https://${sot.url}`} target="_blank" rel="noopener noreferrer">
                  {sot.url}
                </a>
              ) : '-'}
            </DetailValue>
          </DetailItem>

          <DetailItem>
            <DetailLabel>Twitter</DetailLabel>
            <DetailValue>
              <TwitterOutlined />
              {sot.contact_twitter ? (
                <a href={`https://twitter.com/${sot.contact_twitter.replace('@', '')}`} target="_blank" rel="noopener noreferrer">
                  {sot.contact_twitter}
                </a>
              ) : '-'}
            </DetailValue>
          </DetailItem>

          <DetailItem>
            <DetailLabel>Telegram</DetailLabel>
            <DetailValue>
              <SendOutlined />
              {sot.contact_telegram ? (
                <a href={`https://t.me/${sot.contact_telegram.replace('@', '')}`} target="_blank" rel="noopener noreferrer">
                  {sot.contact_telegram}
                </a>
              ) : '-'}
            </DetailValue>
          </DetailItem>
        </DetailSection>

        <Divider />

        <ButtonGroup>
          <Button type="primary" onClick={handleEdit}>
            Edit
          </Button>
          <Button danger onClick={handleDelete} loading={loading}>
            Delete
          </Button>
        </ButtonGroup>
      </>
    );
  };

  return (
    <Container>
      <EditorWrapper>
        {renderContent()}
      </EditorWrapper>
      
      <AssociatedSOTs 
          sot={sot} 
          onSelectSot={onSelectAssociatedSot}
        />
    </Container>
  );
};

export default SOTEditor; 