import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { FileSearch, History, Search, Table } from 'lucide-react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import ViewWrapper from '../../components/ViewWrapper';
import { useAppDispatch } from '../../store/hooks';
import { fetchMonitoredAddresses } from '../../store/slices/monitoredAddressesSlice';

import ActiveCasesTab from './components/active-cases/ActiveCasesTab';
import ArchivedCasesTab from './components/archived-cases/ArchivedCasesTab';
import UnassignedTransactionsTab from './components/unassigned-transactions/UnassignedTransactionsTab';

type TabKey = 'transactions' | 'active-cases' | 'archived-cases';

interface TabConfig {
  key: TabKey;
  label: string;
  icon: React.ReactNode;
  component: React.ReactNode;
}

const ComplianceScreener: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Determine active tab from URL
  const getActiveTabFromUrl = (): TabKey => {
    const path = location.pathname;
    if (path.includes('/active-cases')) return 'active-cases';
    if (path.includes('/archived-cases')) return 'archived-cases';
    return 'transactions'; // default
  };
  
  const [activeTab, setActiveTab] = useState<TabKey>(getActiveTabFromUrl());

  // Update active tab when URL changes
  useEffect(() => {
    setActiveTab(getActiveTabFromUrl());
  }, [location.pathname]);

  // Load monitored addresses from Redux store
  useEffect(() => {
    dispatch(fetchMonitoredAddresses());
  }, [dispatch]);

  // Handle tab change
  const handleTabChange = (activeKey: string) => {
    const newTab = activeKey as TabKey;
    setActiveTab(newTab);

    // Navigate to the appropriate URL
    if (newTab === 'active-cases') {
      navigate('/home/compliance-screener/active-cases');
    } else if (newTab === 'archived-cases') {
      navigate('/home/compliance-screener/archived-cases');
    } else {
      navigate('/home/compliance-screener');
    }
  };

  const getTabDescription = (tab: TabKey): string => {
    switch (tab) {
      case 'active-cases':
        return 'This page manages all active compliance cases with full case lifecycle tracking and assignment.';
      case 'archived-cases':
        return 'This page shows completed and archived compliance cases for reference and auditing.';
      case 'transactions':
        return 'This page shows new unassigned transactions that need to be assigned to a compliance officer for review.';
      default:
        return 'This page monitors client defined wallets for incoming transactions and calculates risk scoring.';
    }
  };


  // Memoize tabConfig to prevent recreation on every render
  const tabConfig: TabConfig[] = useMemo(() => [
    {
      key: 'transactions',
      label: 'Unassigned Transactions',
      icon: <Table className="w-4 h-4 text-orange-500" />,
      component: <UnassignedTransactionsTab initialStatusFilter="UNASSIGNED" />,
    },
    {
      key: 'active-cases',
      label: 'Case Management',
      icon: <FileSearch className="w-4 h-4 text-orange-500" />,
      component: <ActiveCasesTab isActive={activeTab === 'active-cases'} />,
    },
    {
      key: 'archived-cases',
      label: 'Archived Cases',
      icon: <History className="w-4 h-4 text-orange-500" />,
      component: <ArchivedCasesTab isActive={activeTab === 'archived-cases'} />,
    },
  ], [activeTab]);

  return (
    <ViewWrapper
      icon={<Search className="w-8 h-8 text-orange-500" />}
      title="Compliance Screener"
      description={getTabDescription(activeTab)}
      fullWidth={true}
    >
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-auto">
          {tabConfig.map(({ key, label, icon }) => (
            <TabsTrigger
              key={key}
              value={key}
              className="flex items-center gap-2 px-4 py-2.5 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              {icon}
              <span className="text-sm font-medium">{label}</span>
            </TabsTrigger>
          ))}
        </TabsList>
        {tabConfig.map(({ key, component }) => (
          <TabsContent key={key} value={key} className="mt-4">
            {component}
          </TabsContent>
        ))}
      </Tabs>
    </ViewWrapper>
  );
};

export default ComplianceScreener;