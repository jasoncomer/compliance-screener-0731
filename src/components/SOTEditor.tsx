import React, { useState } from 'react';
import { Card, Form, Input, Button, Space, Typography, message, Avatar, Modal, Row, Col, Tag, Switch } from 'antd';
import { UserOutlined, GlobalOutlined, TwitterOutlined, SendOutlined, GithubOutlined, LinkedinOutlined, FacebookOutlined, InstagramOutlined, YoutubeOutlined, RedditOutlined, MediumOutlined } from '@ant-design/icons';
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
  padding-bottom: 2em;
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
  gap: 8px;
  padding-bottom: 2em;
  text-align: left;
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
  align-items: flex-start;
  gap: 8px;
  text-align: left;
  
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

  &.address-line {
    text-align: left;
  }
`;

const HeaderSection = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 1em;
  text-align: left;
`;

const HeaderInfo = styled.div`
  flex: 1;
  text-transform: capitalize;
  text-align: left;
`;

const StyledAvatar = styled(Avatar)`
  width: 64px;
  height: 64px;
`;

const TagsContainer = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: flex-start;
`;

const TagInput = styled(Input)`
  width: 100px;
  margin-right: 8px;
  vertical-align: top;
`;

interface SOTEditorProps {
  sot: SOT | null;
  onSelectAssociatedSot: (sot: SOT) => void;
}

const ToggleSwitch = ({ name, label }: { name: string; label: string }) => (
  <Form.Item
    name={name}
    label={label}
    valuePropName="checked"
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
      <span>{/* Empty span to maintain spacing */}</span>
      <Switch />
    </div>
  </Form.Item>
);

const SOTEditor: React.FC<SOTEditorProps> = ({ sot, onSelectAssociatedSot }) => {
  const [form] = Form.useForm();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const isValidSOT = (sot: SOT | null): sot is SOT => {
    return sot !== null;
  };

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
      const values = await form.validateFields();
      if (!isValidSOT(sot)) return;
      Modal.confirm({
        title: 'Save Changes',
        content: 'Are you sure you want to save these changes?',
        onOk: async () => {
          try {
            setLoading(true);
            await api.blockchain.updateSOT(sot._id, values);
            setIsEditing(false);
            message.success('SOT updated successfully');
          } catch (error) {
            console.error('Failed to update SOT:', error);
            message.error('Failed to update SOT');
          } finally {
            setLoading(false);
          }
        },
      });
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const handleDelete = () => {
    if (!isValidSOT(sot)) return;

    Modal.confirm({
      title: 'Delete SOT',
      content: 'Are you sure you want to delete this SOT? This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
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
      },
    });
  };

  const getSocialMediaIcon = (url: string) => {
    const urlLower = url.toLowerCase();

    if (urlLower.includes('github')) return <GithubOutlined />;
    if (urlLower.includes('twitter')) return <TwitterOutlined />;
    if (urlLower.includes('linkedin')) return <LinkedinOutlined />;
    if (urlLower.includes('facebook')) return <FacebookOutlined />;
    if (urlLower.includes('instagram')) return <InstagramOutlined />;
    if (urlLower.includes('youtube')) return <YoutubeOutlined />;
    if (urlLower.includes('reddit')) return <RedditOutlined />;
    if (urlLower.includes('medium')) return <MediumOutlined />;
    if (urlLower.includes('telegram')) return <SendOutlined />;

    return <GlobalOutlined />;
  };

  const renderContent = () => {
    if (!isValidSOT(sot)) return null;

    if (isEditing) {
      return (
        <Form
          form={form}
          layout="vertical"
          initialValues={sot}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="proper_name" label="Company Name">
                <Input />
              </Form.Item>
              <Form.Item name="entity_id" label="Entity ID">
                <Input />
              </Form.Item>
              <Form.Item name="entity_type" label="Entity Type">
                <Input />
              </Form.Item>
              <Form.Item name="ceo" label="CEO">
                <Input />
              </Form.Item>
              <Form.Item name="founders" label="Founders">
                <Input />
              </Form.Item>
              <Form.Item name="year_founded" label="Year Founded">
                <Input />
              </Form.Item>
              <Form.Item name="social_media_profile" label="Social Media">
                {Object.entries(sot)
                  .filter(([key]) => key.startsWith('social_media_profile'))
                  .map(([key]) => (
                    <Form.Item
                      key={key}
                      name={key}
                    >
                      <Input />
                    </Form.Item>
                  ))}
              </Form.Item>
              
              <ToggleSwitch name="kyc_req" label="KYC Required" />
              <ToggleSwitch name="dead" label="Dead" />
              <ToggleSwitch name="centralized" label="Centralized" />
              <ToggleSwitch name="revisit_site" label="Revisit Site" />

              <Form.Item name="legal_info_url" label="Legal Info URL">
                <Input />
              </Form.Item>
              <Form.Item name="user" label="User">
                <Input />
              </Form.Item>
              <Form.Item name="date_updated" label="Date Updated">
                <Input />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item name="url" label="Website">
                <Input />
              </Form.Item>
              <Form.Item name="contact_phone" label="Phone">
                <Input />
              </Form.Item>
              <Form.Item name="contact_address" label="Address">
                <Input />
              </Form.Item>
              <Form.Item name="contact_twitter" label="Twitter">
                <Input />
              </Form.Item>
              <Form.Item name="contact_telegram" label="Telegram">
                <Input />
              </Form.Item>
              <Form.Item name="contact_email" label="Email">
                <Input />
              </Form.Item>
              <Form.Item name="associate_country_1" label="Country">
                <Input />
              </Form.Item>
              <Form.Item name="logo" label="Logo URL">
                <Input />
              </Form.Item>
              <Form.Item label="Entity Tags">
                <Row gutter={16}>
                  {Object.entries(sot)
                    .filter(([key]) => key.startsWith('entity_tag'))
                    .map(([key]) => (
                      <Col span={12}>
                        <Form.Item key={key} name={key}>
                          <TagInput placeholder={`Tag ${key.replace('entity_tag', '')}`} style={{ width: '100%' }} />
                        </Form.Item>
                      </Col>
                    ))}
                </Row>
              </Form.Item>
              <Form.Item name="description_merged" label="Description">
                <Input.TextArea rows={8} />
              </Form.Item>
            </Col>
          </Row>

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
            <DetailLabel>Status</DetailLabel>
            <DetailValue style={{ display: 'flex', gap: '16px' }}>
              <span>
                <Text>Active: </Text>
                <Switch checked={!sot.dead} disabled />
              </span>
              <span>
                <Text>Centralized: </Text>
                <Switch checked={sot.centralized} disabled />
              </span>
              <span>
                <Text>KYC Required: </Text>
                <Switch checked={sot.kyc_req} disabled />
              </span>
            </DetailValue>
          </DetailItem>

          {(sot.ceo || sot.founders) && (
            <DetailItem style={{ gridColumn: '1 / -1' }}>
              <DetailLabel>Leadership</DetailLabel>
              <DetailValue style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {sot.ceo && <span><strong>CEO:</strong> {sot.ceo}</span>}
                {sot.founders && (
                  <span>
                    <strong>Founders:</strong> {sot.founders.split(',').map(founder =>
                      <Tag key={founder}>{founder}</Tag>
                    )}
                  </span>
                )}
              </DetailValue>
            </DetailItem>
          )}

          <DetailItem style={{ gridColumn: '1 / -1' }}>
            <DetailLabel>Contact Information</DetailLabel>
            <DetailValue style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {sot.contact_email && <span><strong>Email:</strong> {sot.contact_email}</span>}
              {sot.contact_phone && <span><strong>Phone:</strong> {sot.contact_phone}</span>}
              {sot.contact_address && <span><strong>Address:</strong> {sot.contact_address}</span>}
            </DetailValue>
          </DetailItem>

          {Object.entries(sot)
            .filter(([key, value]) => key.startsWith('entity_tag') && value)
            .length > 0 && (
              <DetailItem style={{ gridColumn: '1 / -1' }}>
                <DetailLabel>Tags</DetailLabel>
                <TagsContainer>
                  {Object.entries(sot)
                    .filter(([key, value]) => key.startsWith('entity_tag') && value)
                    .map(([key, value]) => (
                      <Tag key={key} color="blue" style={{ marginBottom: 8, padding: '4px 8px', borderRadius: '16px' }}>
                        {value}
                      </Tag>
                    ))}
                </TagsContainer>
              </DetailItem>
            )}

          {sot.description_merged && (
            <DetailItem style={{ gridColumn: '1 / -1' }}>
              <DetailLabel>Description</DetailLabel>
              <DetailValue>
                <div style={{ whiteSpace: 'pre-wrap' }}>
                  {sot.description_merged}
                </div>
              </DetailValue>
            </DetailItem>
          )}

          <DetailItem style={{ gridColumn: '1 / -1' }}>
            <DetailLabel>Additional Information</DetailLabel>
            <DetailValue style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {sot.year_founded && <span><strong>Founded:</strong> {sot.year_founded}</span>}
              {sot.associate_country_1 && <span><strong>Country:</strong> {sot.associate_country_1}</span>}
              {sot.legal_info_url && (
                <span>
                  <strong>Legal Info:</strong>
                  <a href={sot.legal_info_url} target="_blank" rel="noopener noreferrer">
                    <GlobalOutlined /> View Legal Information
                  </a>
                </span>
              )}
            </DetailValue>
          </DetailItem>

          <DetailItem style={{ gridColumn: '1 / -1', fontSize: '0.9em', color: '#666' }}>
            {sot.user && <div>Last modified by: {sot.user}</div>}
            {sot.date_updated && <div>Updated: {new Date(sot.date_updated).toLocaleString()}</div>}
            {sot.revisit_site && <div>Flagged for review</div>}
          </DetailItem>

          <DetailItem style={{ gridColumn: '1 / -1' }}>
            <DetailLabel>Social Media Profiles</DetailLabel>
            <DetailValue style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {/* Twitter */}
              {sot.contact_twitter && (
                <a
                  href={`https://twitter.com/${sot.contact_twitter.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <TwitterOutlined />
                  <span>{sot.contact_twitter}</span>
                </a>
              )}

              {/* Telegram */}
              {sot.contact_telegram && (
                <a
                  href={`https://t.me/${sot.contact_telegram.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <SendOutlined />
                  <span>{sot.contact_telegram}</span>
                </a>
              )}

              {/* Other social media profiles */}
              {Object.entries(sot)
                .filter(([key, value]) => key.startsWith('social_media_profile') && value)
                .map(([key, value]) => {
                  const icon = getSocialMediaIcon(value);
                  const url = value.startsWith('http') ? value : `https://${value}`;

                  return (
                    <a
                      key={key}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                      {icon}
                      <span>{value}</span>
                    </a>
                  );
                })}
            </DetailValue>
          </DetailItem>
        </DetailSection>

        {/* <Divider />

        <ButtonGroup>
          <Button type="primary" onClick={handleEdit}>
            Edit
          </Button>
          <Button danger onClick={handleDelete} loading={loading}>
            Delete
          </Button>
        </ButtonGroup> */}
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