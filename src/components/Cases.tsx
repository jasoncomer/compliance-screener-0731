import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import CasesTable from './CasesTable';
import ModalAddCase from './modals/ModalAddCase';
import { ICase } from '../typings/interfaces';
import { api } from '../api/api';
import { useAppContext } from '../context/AppContext';

interface Props { }

const CaseWrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  width: 800px;
  max-width: 90%;
  height: 500px;
  margin: calc(50vh - 250px) auto;
  border-radius: 8px;
  padding: 2em;
`;

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
    <>
      <CaseWrapper>
        <CasesTable cases={cases} setIsModalOpen={setIsModalOpen} />
      </CaseWrapper>

      <ModalAddCase
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        cases={cases}
        setCase={handleCase}
        />
    </>
  );
};

export default Cases;