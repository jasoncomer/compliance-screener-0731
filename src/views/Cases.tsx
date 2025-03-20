import React, { useEffect, useState, useCallback } from 'react';
import { FolderOutlined } from '@ant-design/icons';
import ViewWrapper from '../components/ViewWrapper';
import CasesTable from '../components/CasesTable';
import ModalAddCase from '../components/modals/ModalAddCase';
import { ICase } from '../typings/interfaces';
import { api } from '../api/api';
import { useAppContext } from '../context/AppContext';
import { Typography, Spin } from 'antd';

const { Text } = Typography;

const Cases: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { cases, setCases } = useAppContext();
  const [loading, setLoading] = useState(true);

  // Function to load cases - can be called to refresh after changes
  const loadCases = useCallback(async () => {
    setLoading(true);
    try {
      const fetchedCases = await api.cases.getUserCases();
      setCases(fetchedCases);
    } catch (error) {
      console.error('Failed to load cases:', error);
    } finally {
      setLoading(false);
    }
  }, [setCases]);

  // Initial load of cases
  useEffect(() => {
    loadCases();
  }, [loadCases]);

  // Handle case creation
  const handleCaseCreated = (data: ICase) => {
    setCases(prev => [...prev, data]);
  };

  // Function to refresh cases - passed to child components
  const refreshCases = () => {
    loadCases();
  };

  return (
    <ViewWrapper
      icon={<FolderOutlined style={{ fontSize: '28px', color: '#C74D1B', fontWeight: 'bold' }} />}
      title="Cases Management"
    >
      <div style={{ marginBottom: '20px' }}>
        <Text>
          Manage compliance cases, track investigation progress, and collaborate with team members.
          Each case can be moved through a standardized workflow from New to Closed.
        </Text>
      </div>

      {loading && cases.length === 0 ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <Spin size="large" />
        </div>
      ) : (
        <CasesTable 
          cases={cases} 
          setIsModalOpen={setIsModalOpen} 
          refreshCases={refreshCases}
        />
      )}

      <ModalAddCase
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        cases={cases}
        setCase={handleCaseCreated}
      />
    </ViewWrapper>
  );
};

export default Cases;