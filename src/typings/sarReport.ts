export interface ISARReport {
  _id: string;
  
  // Filing Institution Information
  filingInstitution: {
    name: string;
    address: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
    fincenRegistrationNumber: string;
    contactInfo: {
      phone: string;
      email: string;
      contactPerson: string;
    };
  };
  
  // Subject Information
  subject: {
    name: string;
    aliases?: string[];
    dateOfBirth?: Date;
    ssn?: string;
    taxId?: string;
    addresses: {
      street?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      country?: string;
    }[];
    cryptoWallets: {
      address: string;
      blockchain: string;
      label?: string;
    }[];
    ipAddresses?: string[];
    deviceInfo?: string;
    otherIdentifiers?: string[];
  };
  
  // Suspicious Activity Details
  suspiciousActivity: {
    activityDate: Date;
    activityType: string;
    amount: {
      value: number;
      currency: string;
      usdValue?: number;
    };
    cryptoNetworks: string[];
    transactionHashes: string[];
    description: string;
    riskFactors: string[];
    complianceFlags: string[];
  };
  
  // Narrative
  narrative: {
    summary: string;
    detailedDescription: string;
    supportingEvidence: string[];
    complianceJustification: string;
  };
  
  // Supporting Documents
  supportingDocuments: {
    transactionHistory?: string;
    screenshots?: string[];
    blockchainAnalytics?: string;
    otherDocuments?: string[];
  };
  
  // Report Metadata
  reportMetadata: {
    reportId: string;
    filingDate: Date;
    status: 'draft' | 'submitted' | 'accepted' | 'rejected';
    version: number;
    previousVersion?: string;
    submittedBy: string;
    reviewedBy?: string;
    approvedBy?: string;
    submissionMethod: 'web_form' | 'api' | 'xml_upload';
    fincenReferenceNumber?: string;
  };
  
  // Related Data
  relatedTransactions: string[];
  organizationId: string;
  caseId?: string;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export interface SARReportFilters {
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}

export interface SARReportStats {
  total: number;
  byStatus: {
    draft: number;
    submitted: number;
    accepted: number;
    rejected: number;
  };
  byMonth: { [key: string]: number };
  recentActivity: {
    id: string;
    reportId: string;
    status: string;
    createdAt: Date;
    transactionCount: number;
  }[];
}

export interface SARReportGenerationRequest {
  transactionIds: string[];
  customData?: Partial<ISARReport>;
}