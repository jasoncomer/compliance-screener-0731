import { TableProps, Tag, Space, Table } from 'antd';
import { ICase } from '../typings/interfaces';
import { FC } from 'react';

interface Props {
  cases: ICase[];
}

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
        let color = 'yellow';
        switch (status) {
          case 'active':
            color = 'green'; break;
          case 'complete':
            color = 'volcano'; break;
          default:
            color = 'yellow';
        }
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
      render: (_, record) => (
        <Space size="middle">
          <a onClick={() => handleDelete(record.id)}>
            Delete
          </a>
        </Space>
      ),
    },
  ];

  return (
    <Table columns={columns} dataSource={cases} />
  );
};

export default CasesTable;