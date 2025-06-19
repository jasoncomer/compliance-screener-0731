import React, { useEffect } from 'react';
import { Form, Input, Select, Row, Col } from 'antd';
import { MonitoredAddress } from '../../../typings/compliance';

const { Option } = Select;
const { TextArea } = Input;

interface AddressFormProps {
  form: any;
  initialValues?: MonitoredAddress;
}

const AddressForm: React.FC<AddressFormProps> = ({ form, initialValues }) => {
  useEffect(() => {
    form.setFieldsValue({
      blockchain: initialValues?.blockchain || 'bitcoin',
    });
  }, [form, initialValues]);

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={initialValues}
    >
      <Form.Item
        name="address"
        label="Address"
        rules={[{ required: true, message: 'Please input the address' }]}
      >
        <Input />
      </Form.Item>

      <Row gutter={16} style={{ width: '100%' }}>
        {/* Blockchain */}
        <Col xs={12} md={12}>
          <Form.Item
            name="blockchain"
            label="Blockchain"
            rules={[{ required: true, message: 'Please select the blockchain' }]}
          >
            <Select style={{ width: '225px' }}>
              <Option value="bitcoin">Bitcoin</Option>
              <Option value="ethereum">Ethereum</Option>
              {/* Add more blockchains as needed */}
            </Select>
          </Form.Item>
        </Col>

        {/* Client ID */}
        <Col xs={12} md={12}>
          <Form.Item
            name="clientId"
            label="Client ID"
            style={{ width: '225px' }}
          >
            <Input type="text" defaultValue={initialValues?.clientId} />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item
        name="notes"
        label="Notes"
      >
        <TextArea rows={4} />
      </Form.Item>

    </Form>
  );
};

export default AddressForm; 