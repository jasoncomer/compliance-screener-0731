import { TableProps, Tag, Table, Button, Tabs as AntTabs } from 'antd';
import { ICase } from '../typings/interfaces';
import { FC } from 'react';
import styled from 'styled-components';
import { ECaseStatus } from '../typings/enums';
import { truncateAddress } from '../utils/crypto';
import DeleteCaseButton from './DeleteCaseButton';

const Tabs = styled(AntTabs)`
  .ant-tabs-nav {
    margin-bottom: 0;
  }
`;
interface Props {
  cases: ICase[];
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
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

const CasesTable: FC<Props> = ({ cases, setIsModalOpen }) => {
  const columns: TableProps<ICase>['columns'] = [
    {
      title: 'Case #',
      dataIndex: 'caseId',
      key: 'caseId',
      render: (text) => <a>{text}</a>,
    },
    {
      title: 'Client Name',
      dataIndex: 'clientName',
      key: 'clientName',
    },
    {
      title: 'Address',
      dataIndex: 'addresses',
      key: 'addresses',
      render: (addresses) => addresses.map((addr: string) => truncateAddress(addr)).join(', '),
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
      render: (_, record) => <DeleteCaseButton caseDoc={record} />,
    },
  ];

  return (
    <Tabs
      defaultActiveKey="1"
      type="card"
      size={'large'}
      tabBarExtraContent={<Button type="primary" onClick={() => setIsModalOpen(prev => !prev)}>Add Case</Button>}
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