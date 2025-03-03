import React, { useState, useEffect } from 'react';
import { Table, Button, Upload, message, Modal, Form, Input, Select, Tag, Space } from 'antd';
import { UploadOutlined, PlusOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import type { MonitoredAddress, AddressUploadFormat, AddressFilters } from '../types/addresses';
import { api } from '../api/api';
import styled from 'styled-components';

const { Option } = Select;
const { TextArea } = Input;

const Container = styled.div`
  padding: 24px;
`;

const TableActions = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 24px;
  gap: 16px;
`;

const FilterSection = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
`;

interface AddressManagementProps {
  onClose?: () => void;
}

const AddressManagement: React.FC<AddressManagementProps> = ({ onClose }) => {
  const [addresses, setAddresses] = useState<MonitoredAddress[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingAddress, setEditingAddress] = useState<MonitoredAddress | null>(null);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [form] = Form.useForm();
  const [filters, setFilters] = useState<AddressFilters>({});
  const [loading, setLoading] = useState(false);

  // Load addresses on component mount and when filters change
  useEffect(() => {
    const loadAddresses = async () => {
      setLoading(true);
      try {
        const data = await api.compliance.getFilteredAddresses(filters);
        setAddresses(data);
      } catch (error) {
        message.error('Failed to load addresses');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadAddresses();
  }, [filters]);

  const handleAddAddress = () => {
    setEditingAddress(null);
    setIsModalVisible(true);
  };

  const handleEditAddress = (record: MonitoredAddress) => {
    setEditingAddress(record);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  const handleDeleteAddress = (id: string) => {
    Modal.confirm({
      title: 'Are you sure you want to delete this address?',
      content: 'This action cannot be undone.',
      onOk: async () => {
        try {
          await api.compliance.deleteAddress(id);
          setAddresses(addresses.filter(addr => addr.id !== id));
          message.success('Address deleted successfully');
        } catch (error) {
          message.error('Failed to delete address');
          console.error(error);
        }
      },
    });
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      if (editingAddress) {
        // Update existing address
        const updated = await api.compliance.updateAddress(editingAddress.id, values);
        setAddresses(addresses.map(addr =>
          addr.id === editingAddress.id ? updated : addr
        ));
        message.success('Address updated successfully');
      } else {
        // Add new address
        const newAddress = await api.compliance.addAddress({
          ...values,
          tags: values.tags || [],
          isActive: true
        });
        setAddresses([...addresses, newAddress]);
        message.success('Address added successfully');
      }
      setIsModalVisible(false);
      form.resetFields();
      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error('Failed:', error);
      message.error('Operation failed');
    }
  };

  const handleUpload = async () => {
    try {
      const file = fileList[0]?.originFileObj;
      if (!file) {
        message.error('Please select a file');
        return;
      }

      // Read and parse the file
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          let addresses: AddressUploadFormat[];
          if (file.type === 'application/json') {
            addresses = JSON.parse(e.target?.result as string);
          } else {
            // Assume CSV
            const csv = e.target?.result as string;
            const lines = csv.split('\n');
            const headers = lines[0].split(',').map(h => h.trim());
            addresses = lines.slice(1).map(line => {
              const values = line.split(',').map(v => v.trim());
              const addr: any = {};
              headers.forEach((header, i) => {
                if (header === 'tags') {
                  addr[header] = values[i] ? values[i].split(';') : [];
                } else {
                  addr[header] = values[i];
                }
              });
              return addr;
            });
          }

          const response = await api.compliance.bulkUpload(addresses);
          
          if (response.successful.length > 0) {
            message.success(`Successfully uploaded ${response.successful.length} addresses`);
          }
          
          if (response.failed.length > 0) {
            Modal.warning({
              title: 'Some addresses failed to upload',
              content: (
                <div>
                  <p>{response.failed.length} addresses failed to upload:</p>
                  <ul>
                    {response.failed.map((fail, index) => (
                      <li key={index}>
                        {fail.entry.address}: {fail.reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )
            });
          }

          // Refresh the address list
          const updatedAddresses = await api.compliance.getFilteredAddresses(filters);
          setAddresses(updatedAddresses);
        } catch (error) {
          console.error('Failed to process file:', error);
          message.error('Failed to process file');
        }
      };

      if (file.type === 'application/json') {
        reader.readAsText(file);
      } else {
        reader.readAsText(file);
      }

      setUploadModalVisible(false);
      setFileList([]);
    } catch (error) {
      console.error('Upload failed:', error);
      message.error('Upload failed');
    }
  };

  const columns = [
    {
      title: 'Address',
      dataIndex: 'address',
      key: 'address',
    },
    {
      title: 'Blockchain',
      dataIndex: 'blockchain',
      key: 'blockchain',
    },
    {
      title: 'Entity Name',
      dataIndex: 'entityName',
      key: 'entityName',
    },
    {
      title: 'Risk Threshold',
      dataIndex: 'riskThreshold',
      key: 'riskThreshold',
    },
    {
      title: 'Tags',
      dataIndex: 'tags',
      key: 'tags',
      render: (tags: string[]) => (
        <>
          {tags.map(tag => (
            <Tag key={tag}>{tag}</Tag>
          ))}
        </>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, record: MonitoredAddress) => (
        <Space size="middle">
          <Button type="link" onClick={() => handleEditAddress(record)}>Edit</Button>
          <Button type="link" danger onClick={() => handleDeleteAddress(record.id)}>Delete</Button>
        </Space>
      ),
    },
  ];

  return (
    <Container>
      <TableActions>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAddAddress}>
            Add Address
          </Button>
          <Button icon={<UploadOutlined />} onClick={() => setUploadModalVisible(true)}>
            Batch Upload
          </Button>
        </Space>
      </TableActions>

      <FilterSection>
        <Select
          placeholder="Blockchain"
          style={{ width: 200 }}
          onChange={(value) => setFilters({ ...filters, blockchain: value })}
          allowClear
        >
          <Option value="Ethereum">Ethereum</Option>
          <Option value="Bitcoin">Bitcoin</Option>
          {/* Add more blockchains as needed */}
        </Select>
        <Select
          placeholder="Status"
          style={{ width: 200 }}
          onChange={(value) => setFilters({ ...filters, isActive: value })}
          allowClear
        >
          <Option value={true}>Active</Option>
          <Option value={false}>Inactive</Option>
        </Select>
        <Input.Search
          placeholder="Search by entity name"
          style={{ width: 300 }}
          onSearch={(value) => setFilters({ ...filters, entityName: value })}
        />
      </FilterSection>

      <Table
        columns={columns}
        dataSource={addresses}
        rowKey="id"
        loading={loading}
      />

      {/* Add/Edit Address Modal */}
      <Modal
        title={editingAddress ? 'Edit Address' : 'Add Address'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            name="address"
            label="Address"
            rules={[{ required: true, message: 'Please input the address' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="blockchain"
            label="Blockchain"
            rules={[{ required: true, message: 'Please select the blockchain' }]}
          >
            <Select>
              <Option value="Ethereum">Ethereum</Option>
              <Option value="Bitcoin">Bitcoin</Option>
              {/* Add more blockchains as needed */}
            </Select>
          </Form.Item>
          <Form.Item
            name="entityName"
            label="Entity Name"
            rules={[{ message: 'Please input the entity name' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="riskThreshold"
            label="Risk Threshold"
          >
            <Input type="number" />
          </Form.Item>
          <Form.Item
            name="tags"
            label="Tags"
          >
            <Select mode="tags" />
          </Form.Item>
          <Form.Item
            name="notes"
            label="Notes"
          >
            <TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Batch Upload Modal */}
      <Modal
        title="Batch Upload Addresses"
        open={uploadModalVisible}
        onOk={handleUpload}
        onCancel={() => {
          setUploadModalVisible(false);
          setFileList([]);
        }}
      >
        <Upload
          accept=".csv,.json"
          fileList={fileList}
          onChange={({ fileList }) => setFileList(fileList)}
          beforeUpload={() => false}
        >
          <Button icon={<UploadOutlined />}>Select File</Button>
        </Upload>
        <div style={{ marginTop: 16 }}>
          <p>Supported formats: CSV, JSON</p>
          <p>Required columns: address, blockchain, entityName</p>
          <p>Optional columns: riskThreshold, tags (semicolon-separated), notes</p>
          <p>Example CSV format:</p>
          <pre>
            address,blockchain,entityName,riskThreshold,tags,notes{'\n'}
            0x123...,Ethereum,Exchange A,75,exchange;high-risk,Major exchange{'\n'}
            1abc...,Bitcoin,Mixer B,90,mixer;high-risk,Known mixer
          </pre>
        </div>
      </Modal>
    </Container>
  );
};

export default AddressManagement; 