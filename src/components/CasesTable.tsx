import { TableProps, Tag, Table, Button as AntButton, Tabs as AntTabs } from 'antd';
import { ICase } from '../typings/interfaces';
import { FC, useState } from 'react';
import styled from 'styled-components';
import { ECaseStatus } from '../typings/enums';
import { truncateAddress } from '../utils/crypto';
import DeleteCaseButton from './DeleteCaseButton';
import ModalCaseContent from './modals/ModalCaseContent';

const Tabs = styled(AntTabs)`
  .ant-tabs-nav {
    margin-bottom: 0;

  }
`;

const Button = styled(AntButton)`
  box-shadow: none;
  margin-bottom: 5px;
  height: 32px;
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
  const [selectedCase, setSelectedCase] = useState<ICase>();

  const selectCase = (caseId: string) => {
    const selected = cases.find((c) => c.caseId === caseId);
    if (selected) {
      setSelectedCase(selected);
    }
  };
  const closeModal = () => setSelectedCase(undefined);

  const columns: TableProps<ICase>['columns'] = [
    {
      title: 'Case #',
      dataIndex: 'caseId',
      key: 'caseId',
      render: (text) => <a onClick={(e) => {
        e.preventDefault();
        selectCase(text);
      }} >{text}</a>,
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
    <>
      <Tabs
        defaultActiveKey="1"
        type="card"
        size={'large'}
        tabBarExtraContent={<Button type="primary" size="middle" onClick={() => setIsModalOpen(prev => !prev)}>Add Case</Button>}
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
                key={item.key}
                columns={columns}
                dataSource={localCases}
              
              />
            )
          }
        })}
      />

      {selectedCase &&
        <ModalCaseContent userCase={selectedCase} open={!!selectedCase} close={closeModal} />
      }
    </>
  );
};

export default CasesTable;