import React, { useEffect, useState } from 'react';
import { FolderOutlined } from '@ant-design/icons';
import ViewWrapper from '../components/ViewWrapper';
import CasesTable from '../components/CasesTable';
import ModalAddCase from '../components/modals/ModalAddCase';
import { ICase } from '../typings/interfaces';
import { api } from '../api/api';
import { useAppContext } from '../context/AppContext';

interface Props { }

const Cases: React.FC<Props> = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { cases, setCases } = useAppContext();

  useEffect(() => {
    api.cases.getUserCases()
      .then(res => setCases(res))
      .catch(console.error)
  }, [setCases]);

  useEffect(() => {
    console.log('cases', cases);
  }, [cases]);

  const handleCase = (data: ICase) => {
    console.log(data);
    setCases(prev => [...prev, data]);
  };

  return (
    <ViewWrapper
      icon={<FolderOutlined style={{ fontSize: '28px', color: '#C74D1B', fontWeight: 'bold' }} />}
      title="Cases"
    >
      <CasesTable cases={cases} setIsModalOpen={setIsModalOpen} />

      <ModalAddCase
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        cases={cases}
        setCase={handleCase}
      />
    </ViewWrapper>
  );
};

export default Cases;