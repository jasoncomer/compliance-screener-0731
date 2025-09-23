import React, { useEffect } from 'react';

import { Col,Form, Row } from 'antd';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { MonitoredAddress } from '../../../typings/compliance';

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
      className="space-y-4"
    >
      <Form.Item
        name="address"
        label={<span className="text-gray-700 dark:text-gray-300">Address</span>}
        rules={[{ required: true, message: 'Please input the address' }]}
      >
        <Input />
      </Form.Item>

      <Row gutter={16} style={{ width: '100%' }}>
        {/* Blockchain */}
        <Col xs={12} md={12}>
          <Form.Item
            name="blockchain"
            label={<span className="text-gray-700 dark:text-gray-300">Blockchain</span>}
            rules={[{ required: true, message: 'Please select the blockchain' }]}
            getValueFromEvent={(value) => value}
            getValueProps={(value) => ({ value })}
          >
            <Select
              onValueChange={(value) => {
                form.setFieldsValue({ blockchain: value });
                form.validateFields(['blockchain']);
              }}
            >
              <SelectTrigger className="w-[225px]">
                <SelectValue placeholder="Select a blockchain" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bitcoin">Bitcoin</SelectItem>
                <SelectItem value="ethereum">Ethereum</SelectItem>
                {/* Add more blockchains as needed */}
              </SelectContent>
            </Select>
          </Form.Item>
        </Col>

        {/* Client ID */}
        <Col xs={12} md={12}>
          <Form.Item
            name="clientId"
            label={<span className="text-gray-700 dark:text-gray-300">Client ID</span>}
            style={{ width: '225px' }}
          >
            <Input
              type="text"
              defaultValue={initialValues?.clientId}
            />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item
        name="notes"
        label={<span className="text-gray-700 dark:text-gray-300">Notes</span>}
      >
        <Textarea
          rows={4}
          className="min-h-[100px]"
        />
      </Form.Item>

    </Form>
  );
};

export default AddressForm; 