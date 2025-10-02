import React from 'react';

import { Search } from 'lucide-react';

import ViewWrapper from '../../components/ViewWrapper';
import ClientOverviewTab from './components/client-overview/ClientOverviewTab';

const ClientOverviewPage: React.FC = () => {
  return (
    <ViewWrapper
      icon={<Search className="w-8 h-8 text-orange-500" />}
      title="Client Overview"
      description="This page provides comprehensive client analytics including transaction metrics, case history, and risk trends."
      fullWidth={true}
    >
      <ClientOverviewTab />
    </ViewWrapper>
  );
};

export default ClientOverviewPage;