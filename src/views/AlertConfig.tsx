import React, { useCallback,useEffect, useState } from 'react';

import { AutoComplete,Button, Form, Input, InputNumber, message, Radio, Select, Typography } from 'antd';

import { colors } from '@/design-system/tokens'

import { useTheme } from '../context/ThemeContext';

const { Title, Paragraph } = Typography;
const { Option } = Select;

const AlertConfig: React.FC = () => {
  const { theme } = useTheme();
  const [form] = Form.useForm();
  const [previewSentence, setPreviewSentence] = useState('');
  const [entityOptions, setEntityOptions] = useState<{ value: string }[]>([]);
  const [anyAmount, setAnyAmount] = useState(false);

  const onFinish = (values: any) => {
    console.log('Alert configuration saved:', { ...values, anyAmount });
    message.success('Alert configuration saved successfully');
    // You can persist this configuration as needed
  };

  const resetForm = () => {
    form.resetFields();
    setAnyAmount(false);
  };

  const handleEntitySearch = (value: string) => {
    let options: { value: string }[] = [];
    if (value && value.length > 1) {
      // Dummy search: simulate results
      options = [
        { value: `${value} Inc` },
        { value: `${value} LLC` },
        { value: `${value} Group` }
      ];
    }
    setEntityOptions(options);
  };

  const onValuesChange = useCallback((_: any, allValues: any) => {
    const { targetType, target, blockchain, amount, direction, severity, counterpartyRelation, counterpartyEntity } = allValues;

    if (target && blockchain && (amount !== undefined || anyAmount) && direction && severity) {
      const amountString = anyAmount ? 'any amount' : amount;
      let directionString = direction;
      if (direction === 'either') {
        directionString = 'in or out';
      }

      let sentence = `Set alert for ${targetType === 'address' ? 'address' : 'entity'} ${target} on ${blockchain} when ${amountString} is transferred ${directionString}`;

      if (counterpartyRelation && counterpartyEntity) {
        let relationString = counterpartyRelation;
        if (counterpartyRelation === 'either') {
          relationString = 'to or from';
        }
        sentence += ` ${relationString} ${counterpartyEntity}`;
      }

      sentence += ` with severity ${severity.toUpperCase()}, send alarm.`;
      setPreviewSentence(sentence);
    } else {
      setPreviewSentence('');
    }
  }, [anyAmount]);

  useEffect(() => {
    // Initialize preview sentence on mount
    const values = form.getFieldsValue();
    onValuesChange(null, values);
  }, [form, onValuesChange]);

  useEffect(() => {
    // Update preview sentence when anyAmount changes
    const values = form.getFieldsValue();
    onValuesChange(null, values);
  }, [anyAmount, form, onValuesChange]);

  return (
    <div style={{ 
      padding: '0px 20px 20px 20px',
      backgroundColor: theme === 'dark' ? colors.gray[900] : colors.white,
      color: theme === 'dark' ? colors.white : colors.gray[800]
    }}>
      <Title level={3} style={{ 
        marginTop: 0,
        color: theme === 'dark' ? colors.white : colors.gray[800]
      }}>Alert Configuration</Title>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        onValuesChange={onValuesChange}
        initialValues={{
          targetType: 'address',
          target: '',
          blockchain: 'Bitcoin',
          amount: 100,
          direction: 'in',
          severity: 'medium',
          counterpartyRelation: '',
          counterpartyEntity: '',
          alertSummary: '',
        }}
      >
        <Form.Item
          label="Alert Target Type"
          name="targetType"
          rules={[{ required: true, message: 'Please select target type' }]}
        >
          <Radio.Group>
            <Radio value="address">Address</Radio>
            <Radio value="entity">Entity</Radio>
          </Radio.Group>
        </Form.Item>

        <Form.Item
          label="Target Address/Entity"
          name="target"
          rules={[{ required: true, message: 'Please enter a target address or entity' }]}
        >
          <AutoComplete
            placeholder="Search by name, address, or type..."
            options={entityOptions}
            onSearch={handleEntitySearch}
            filterOption={false}
            className="ant-input-outlined"
          >
            <Input autoComplete="off" />
          </AutoComplete>
        </Form.Item>

        <Form.Item
          label="Blockchain"
          name="blockchain"
          rules={[{ required: true, message: 'Please select a blockchain' }]}
        >
          <Select>
            <Option value="Bitcoin">Bitcoin</Option>
            <Option value="Ethereum">Ethereum</Option>
            <Option value="Binance Smart Chain">Binance Smart Chain</Option>
            <Option value="Polygon">Polygon</Option>
          </Select>
        </Form.Item>

        <Form.Item
          label="Transfer Amount Condition"
          name="amount"
          rules={[{ required: !anyAmount, message: 'Please enter an amount or choose Any Amount' }]}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <InputNumber
              disabled={anyAmount}
              min={0}
              style={{ width: '100%' }}
            />
            <Button
              style={{ marginLeft: '10px' }}
              onClick={() => {
                 if (!anyAmount) {
                   setAnyAmount(true);
                   form.setFieldsValue({ amount: undefined });
                 } else {
                   setAnyAmount(false);
                   form.setFieldsValue({ amount: 100 });
                 }
              }}
            >
              {anyAmount ? 'Custom Amount' : 'Any Amount'}
            </Button>
          </div>
        </Form.Item>

        <Form.Item
          label="Transfer Direction"
          name="direction"
          rules={[{ required: true, message: 'Please select transfer direction' }]}
        >
          <Radio.Group>
            <Radio value="in">In</Radio>
            <Radio value="out">Out</Radio>
            <Radio value="either">Either</Radio>
          </Radio.Group>
        </Form.Item>

        <Form.Item
          label="Alert Severity"
          name="severity"
          rules={[{ required: true, message: 'Please select alert severity' }]}
        >
          <Select>
            <Option value="low">Low</Option>
            <Option value="medium">Medium</Option>
            <Option value="high">High</Option>
          </Select>
        </Form.Item>

        <Form.Item
          label="Counterparty Relation (optional)"
          name="counterpartyRelation"
        >
          <Select placeholder="Select relation" allowClear>
            <Option value="to">to</Option>
            <Option value="from">from</Option>
            <Option value="either">Either</Option>
          </Select>
        </Form.Item>

        <Form.Item
          label="Counterparty Address/Entity (optional)"
          name="counterpartyEntity"
        >
          <AutoComplete
            placeholder="Search by name, address, or type..."
            options={entityOptions}
            onSearch={handleEntitySearch}
            filterOption={false}
            className="ant-input-outlined"
          >
            <Input autoComplete="off" />
          </AutoComplete>
        </Form.Item>

        <Form.Item
          label="Alert Summary (optional)"
          name="alertSummary"
        >
          <Input.TextArea 
            rows={3} 
            placeholder="Enter a friendly summary of the alert"
            allowClear={false}
            showCount={false}
            count={undefined}
            onClear={undefined}
          />
        </Form.Item>

        {previewSentence && (
          <Paragraph strong style={{ 
            marginBottom: '20px',
            color: theme === 'dark' ? colors.white : colors.gray[800]
          }}>
            {previewSentence}
          </Paragraph>
        )}

        <Form.Item style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button type="primary" htmlType="submit">
            Save Configuration
          </Button>
          <Button type="default" style={{ marginLeft: '10px' }} onClick={resetForm}>
            Reset Form
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default AlertConfig; 