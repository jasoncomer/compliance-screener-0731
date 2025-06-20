"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ActiveCases from "./compliance-dashboard/active-cases-tab"
import ArchivedCasesTab from "./compliance-dashboard/archived-cases-tab"
// import ComplianceHeader from "./compliance-dashboard/components/ComplianceHeader"
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
      {/* <ComplianceHeader /> */}

      <div className="p-6">
        <Tabs defaultValue="monitoring" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-gray-800">
            <TabsTrigger value={EComplianceTab.UNASSIGNED_TRANSACTIONS} className="data-[state=active]:bg-red-600">
              Unassigned Transactions
            </TabsTrigger>
            <TabsTrigger value={EComplianceTab.ACTIVE_CASES}>Active Cases</TabsTrigger>
            <TabsTrigger value={EComplianceTab.MONITORED_ADDRESSES}>Monitored Addresses</TabsTrigger>
            <TabsTrigger value={EComplianceTab.ARCHIVED_CASES}>Archived Cases</TabsTrigger>
          </TabsList>

          <TabsContent value={EComplianceTab.UNASSIGNED_TRANSACTIONS}>
            <UnassignedTransactionsTab />
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
