import { TableProps, Tag, Space, Table, Button, Tabs as AntTabs } from 'antd';
import { ICase } from '../typings/interfaces';
import { FC } from 'react';
import { DeleteOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import { ECaseStatus } from '../typings/enums';

const Tabs = styled(AntTabs)`
  .ant-tabs-nav {
    margin-bottom: 0;
  }
`;
interface Props {
  cases: ICase[];
}

const CardTabItems = [
  {
    label: 'Active',
    key: '1',
  },
  {
    label: 'Complete',
    key: '2',
  },
];

const CasesTable: FC<Props> = ({ cases }) => {
  const handleDelete = (id: string) => {
    console.log('delete', id);
  }

  const columns: TableProps<ICase>['columns'] = [
    {
      title: 'Case #',
      dataIndex: 'id',
      key: 'id',
      render: (text) => <a>{text}</a>,
    },
    {
      title: 'Client Name',
      dataIndex: 'clientName',
      key: 'clientName',
    },
    {
      title: 'Address',
      dataIndex: 'blockchainAddress',
      key: 'blockchainAddress',
    },
    {
      title: 'Status',
      key: 'status',
      dataIndex: 'status',
      render: (_, { status }) => {
        const color = status === ECaseStatus.ACTIVE ? 'green' : 'orange';
        return (
          <Tag color={color}>
            {status}
          </Tag>
        )
      },
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => {
        if (record.status === ECaseStatus.ARCHIVED) return null;
        return (
          <Space size="middle">
            <Button type="default" icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)}></Button>
          </Space>
        );
      }
    },
  ];

  return (
    <Tabs
      defaultActiveKey="1"
      type="card"
      size={'large'}
      items={CardTabItems.map((item) => {
        let localCases = cases;
        switch (item.key) {
          case '1':
            localCases = cases.filter((c) => c.status === ECaseStatus.ACTIVE);
            break;
          case '2':
            localCases = cases.filter((c) => c.status === ECaseStatus.ARCHIVED);
            break;
        }

        return {
          label: item.label,
          key: item.key,
          children: (
            <Table<ICase>
              columns={columns}
              dataSource={localCases}
            />
          )
        }
      })}
    />
  );
};

export default CasesTable;