
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import ActiveCases from "./compliance-dashboard/active-cases-tab"
import ArchivedCasesTab from "./compliance-dashboard/archived-cases-tab"
import ComplianceHeader from "./compliance-dashboard/components/ComplianceHeader"
import MonitoredAddresses from "./compliance-dashboard/monitored-addresses-tab"
import UnassignedTransactionsTab from "./compliance-dashboard/unassigned-transactions-tab"

export enum EComplianceTab {
  UNASSIGNED_TRANSACTIONS = "unassigned-transactions",
  ACTIVE_CASES = "active-cases",
  MONITORED_ADDRESSES = "monitored-addresses",
  ARCHIVED_CASES = "archived-cases"
}

export function ComplianceDashboard() {

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <ComplianceHeader />

      <div className="p-6">
        <Tabs defaultValue="monitoring" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-transparent gap-0 p-0">
            <TabsTrigger value={EComplianceTab.UNASSIGNED_TRANSACTIONS} className="data-[state=active]:bg-red-600 border border-gray-600 bg-gray-800 hover:bg-gray-700 data-[state=active]:border-red-500 data-[state=active]:text-white">
              Unassigned Transactions
            </TabsTrigger>
            <TabsTrigger value={EComplianceTab.ACTIVE_CASES} className="border border-gray-600 bg-gray-800 hover:bg-gray-700 data-[state=active]:bg-gray-700 data-[state=active]:border-gray-500 data-[state=active]:text-white">Active Cases</TabsTrigger>
            <TabsTrigger value={EComplianceTab.MONITORED_ADDRESSES} className="border border-gray-600 bg-gray-800 hover:bg-gray-700 data-[state=active]:bg-gray-700 data-[state=active]:border-gray-500 data-[state=active]:text-white">Monitored Addresses</TabsTrigger>
            <TabsTrigger value={EComplianceTab.ARCHIVED_CASES} className="border border-gray-600 bg-gray-800 hover:bg-gray-700 data-[state=active]:bg-gray-700 data-[state=active]:border-gray-500 data-[state=active]:text-white">Archived Cases</TabsTrigger>
          </TabsList>

          <TabsContent value={EComplianceTab.UNASSIGNED_TRANSACTIONS}>
            <UnassignedTransactionsTab initialStatusFilter="UNASSIGNED" />
          </TabsContent>
          <TabsContent value={EComplianceTab.ACTIVE_CASES}>
            <ActiveCases />
          </TabsContent>

          <TabsContent value={EComplianceTab.MONITORED_ADDRESSES}>
            <MonitoredAddresses />
          </TabsContent>

          <TabsContent value={EComplianceTab.ARCHIVED_CASES}>
            <ArchivedCasesTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
