import { AlertTriangle, CheckCircle, Clock, Shield, FileText } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import { Transaction } from "../../components/types"
import { CaseReportSection } from "@/components/CaseReportSection"
import { useAppSelector } from "@/store/hooks"
import { selectCurrentOrganization } from "@/store/slices/organizationsSlice"

interface ActionsTabProps {
  transaction: Transaction
}

export default function ActionsTab({ transaction }: ActionsTabProps) {
  const currentOrganization = useAppSelector(selectCurrentOrganization);
  
  return (
    <div className="space-y-4">
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white text-lg">Case Assignment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-gray-400">Assign To</Label>
            <Select>
              <SelectTrigger className="bg-gray-900 border-gray-600 mt-1">
                <SelectValue placeholder="Select compliance officer..." />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="officer1">Sarah Chen - Senior Analyst</SelectItem>
                <SelectItem value="officer2">Michael Rodriguez - Compliance Officer</SelectItem>
                <SelectItem value="officer3">Emma Thompson - AML Specialist</SelectItem>
                <SelectItem value="officer4">David Kim - Investigation Lead</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-gray-400">Priority Level</Label>
            <Select>
              <SelectTrigger className="bg-gray-900 border-gray-600 mt-1">
                <SelectValue placeholder="Set priority..." />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="critical">Critical - Immediate Action Required</SelectItem>
                <SelectItem value="high">High - Review Within 4 Hours</SelectItem>
                <SelectItem value="medium">Medium - Review Within 24 Hours</SelectItem>
                <SelectItem value="low">Low - Standard Review Process</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white text-lg">Available Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <Button className="bg-green-600 hover:bg-green-700">
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve Transaction
            </Button>
            <Button variant="destructive">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Flag for Review
            </Button>
            <Button variant="outline" className="border-gray-600 text-gray-300">
              <Clock className="h-4 w-4 mr-2" />
              Request More Info
            </Button>
            <Button variant="outline" className="border-gray-600 text-gray-300">
              <Shield className="h-4 w-4 mr-2" />
              Escalate to Senior
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white text-lg">Regulatory Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full justify-start border-gray-600 text-gray-300 hover:bg-indigo-600 hover:text-white hover:border-indigo-600"
              onClick={handleGenerateSAR}
            >
              <FileText className="h-4 w-4 mr-2" />
              Generate SAR Report
            </Button>
            <Button variant="outline" className="w-full justify-start border-gray-600 text-gray-300">
              <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              Create Compliance Report
            </Button>
            <Button variant="outline" className="w-full justify-start border-gray-600 text-gray-300">
              <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              Notify Regulatory Authority
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Case Report Section */}
      <CaseReportSection
        caseId={transaction.id || 'default-case-id'}
        transactionId={transaction.txId} // Using actual Bitcoin transaction hash
        organizationId={currentOrganization?._id || 'default-org-id'}
      />
    </div>
  )
}