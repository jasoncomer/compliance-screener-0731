import React, { useEffect,useState } from 'react';

import { Filter,X } from 'lucide-react';

import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import { cn } from '../../../lib/utils';
import { useAppSelector } from '../../../store/hooks';
import { selectActiveOrgMembers } from '../../../store/slices/organizationsSlice';
import { EComplianceTransactionStatus, TransactionFilters } from '../../../typings/compliance';
import { getUserDisplayName } from '../../../utils/display-labels';

interface ComplianceFilterPanelProps {
  className?: string;

  // Filter visibility controls
  showStatusFilter?: boolean;
  showBlockchainFilter?: boolean;
  showClientIdFilter?: boolean;
  showAssignedToFilter?: boolean;
  showCounterpartyEntityFilter?: boolean;
  showTransactionIdFilter?: boolean;
  showDateRangeFilter?: boolean;
  showRiskLevelFilter?: boolean;
  showAmountFilter?: boolean;

  // Available options
  availableBlockchains?: string[];
  availableClientIds?: string[];
  statusOptions?: Array<{ value: EComplianceTransactionStatus; label: string }>;

  // Default/initial values
  defaultStatus?: string | string[];

  // Callbacks
  onFilterChange: (filters: TransactionFilters) => void;
  onClearFilters: () => void;

  // Behavior options
  applyOnChange?: boolean; // If true, filters apply immediately. If false, requires "Apply" button
}

const ComplianceFilterPanel: React.FC<ComplianceFilterPanelProps> = ({
  className,
  showStatusFilter = true,
  showBlockchainFilter = true,
  showClientIdFilter = true,
  showAssignedToFilter = true,
  showCounterpartyEntityFilter = false,
  showTransactionIdFilter = false,
  showDateRangeFilter = true,
  showRiskLevelFilter = true,
  showAmountFilter = true,
  availableBlockchains = [],
  availableClientIds = [],
  statusOptions,
  defaultStatus,
  onFilterChange,
  onClearFilters,
  applyOnChange = false
}) => {
  const organizationMembers = useAppSelector(selectActiveOrgMembers);

  // Form state
  const [formValues, setFormValues] = useState<any>({});

  // Default status options for all statuses
  const defaultStatusOptions = [
    { value: EComplianceTransactionStatus.UNASSIGNED, label: 'Unassigned' },
    { value: EComplianceTransactionStatus.UNREVIEWED, label: 'Unreviewed' },
    { value: EComplianceTransactionStatus.IN_REVIEW, label: 'In Review' },
    { value: EComplianceTransactionStatus.HOLD, label: 'Hold' },
    { value: EComplianceTransactionStatus.APPROVED, label: 'Approved' },
    { value: EComplianceTransactionStatus.CLOSED_WITH_NOTE, label: 'Approved with Note' },
    { value: EComplianceTransactionStatus.CLOSED_WITH_SAR, label: 'Closed with SAR' },
  ];

  const effectiveStatusOptions = statusOptions || defaultStatusOptions;

  // Initialize form values with defaults
  useEffect(() => {
    if (defaultStatus) {
      const statusValue = Array.isArray(defaultStatus) ? defaultStatus.join(',') : defaultStatus;
      setFormValues((prev: any) => ({ ...prev, status: statusValue }));
    }
  }, [defaultStatus]);

  // Process form values into TransactionFilters
  const processFilterValues = (values: any): TransactionFilters => {
    const { dateFrom, dateTo, minAmount, maxAmount, ...rest } = values;
    const filters: TransactionFilters = { ...rest };

    // Date range filter
    if (dateFrom && dateTo) {
      const startDate = new Date(dateFrom);
      const endDate = new Date(dateTo);
      endDate.setHours(23, 59, 59, 999); // End of day

      filters.timestamp = {
        from: startDate.toISOString(),
        to: endDate.toISOString()
      };
    }

    // Amount filters
    if (minAmount) {
      filters.minAmount = parseFloat(minAmount) * 100000000; // Convert to satoshis
    }

    if (maxAmount) {
      filters.maxAmount = parseFloat(maxAmount) * 100000000; // Convert to satoshis
    }

    // Clean up undefined values
    Object.keys(filters).forEach(key => {
      if (filters[key as keyof TransactionFilters] === undefined || filters[key as keyof TransactionFilters] === '') {
        delete filters[key as keyof TransactionFilters];
      }
    });

    return filters;
  };

  // Handle field change
  const handleFieldChange = (field: string, value: any) => {
    const newValues = { ...formValues, [field]: value || undefined };
    setFormValues(newValues);

    if (applyOnChange) {
      const filters = processFilterValues(newValues);
      onFilterChange(filters);
    }
  };

  // Handle filter submit (for manual apply mode)
  const handleFilterSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const filters = processFilterValues(formValues);
    onFilterChange(filters);
  };

  // Clear all filters
  const handleClearFilters = () => {
    setFormValues({});
    onClearFilters();
  };

  return (
    <Card className={cn("border-gray-200 dark:border-gray-700", className)}>
      <CardHeader className="py-3">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center">
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </span>
          <Button
            onClick={handleClearFilters}
            size="sm"
            variant="outline"
            className="h-8"
          >
            <X className="mr-2 h-3 w-3" />
            Clear Filters
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-3">
        <form
          onSubmit={handleFilterSubmit}
          className="flex flex-wrap gap-2"
        >
          {/* Status Select */}
          {showStatusFilter && (
            <div className="w-[150px]">
              <Select
                value={formValues.status || ''}
                onValueChange={(value) => handleFieldChange('status', value)}
              >
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {effectiveStatusOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Blockchain Select */}
          {showBlockchainFilter && (
            <div className="w-[130px]">
              <Select
                value={formValues.blockchain || ''}
                onValueChange={(value) => handleFieldChange('blockchain', value)}
              >
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Blockchain" />
                </SelectTrigger>
                <SelectContent>
                  {availableBlockchains
                    .filter(blockchain => blockchain)
                    .map(blockchain => (
                      <SelectItem key={blockchain} value={blockchain}>
                        {blockchain.charAt(0).toUpperCase() + blockchain.slice(1)}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Client ID */}
          {showClientIdFilter && (
            availableClientIds && availableClientIds.length > 0 ? (
              <div className="w-[120px]">
                <Select
                  value={formValues.clientId || ''}
                  onValueChange={(value) => handleFieldChange('clientId', value)}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="Client ID" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableClientIds
                      .filter(clientId => clientId)
                      .map(clientId => (
                        <SelectItem key={clientId} value={clientId}>
                          {clientId}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <Input
                placeholder="Client ID"
                value={formValues.clientId || ''}
                onChange={(e) => handleFieldChange('clientId', e.target.value)}
                className="w-[150px] h-8"
              />
            )
          )}

          {/* Assigned To Select */}
          {showAssignedToFilter && (
            <div className="w-[140px]">
              <Select
                value={formValues.assignedTo || ''}
                onValueChange={(value) => handleFieldChange('assignedTo', value)}
              >
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Assigned To" />
                </SelectTrigger>
                <SelectContent>
                  {organizationMembers
                    .filter(member => member.userId)
                    .map(member => (
                      <SelectItem key={member.userId} value={member.userId || ''}>
                        {getUserDisplayName(member)}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Counterparty Entity */}
          {showCounterpartyEntityFilter && (
            <Input
              placeholder="Counterparty Entity"
              value={formValues.counterpartyEntity || ''}
              onChange={(e) => handleFieldChange('counterpartyEntity', e.target.value)}
              className="w-[180px] h-8"
            />
          )}

          {/* Transaction ID */}
          {showTransactionIdFilter && (
            <Input
              placeholder="Transaction ID"
              value={formValues.txId || ''}
              onChange={(e) => handleFieldChange('txId', e.target.value)}
              className="w-[200px] h-8"
            />
          )}

          {/* Date Range */}
          {showDateRangeFilter && (
            <div className="flex gap-1">
              <Input
                type="date"
                value={formValues.dateFrom || ''}
                onChange={(e) => handleFieldChange('dateFrom', e.target.value)}
                className="w-[140px] h-8"
              />
              <Input
                type="date"
                value={formValues.dateTo || ''}
                onChange={(e) => handleFieldChange('dateTo', e.target.value)}
                className="w-[140px] h-8"
              />
            </div>
          )}

          {/* Risk Level Select */}
          {showRiskLevelFilter && (
            <div className="w-[120px]">
              <Select
                value={formValues.riskLevel || ''}
                onValueChange={(value) => handleFieldChange('riskLevel', value)}
              >
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Risk level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High ({'>'}70)</SelectItem>
                  <SelectItem value="medium">Medium (41-70)</SelectItem>
                  <SelectItem value="low">Low (≤40)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Amount Range */}
          {showAmountFilter && (
            <>
              <Input
                type="number"
                placeholder="Min BTC"
                step="0.0001"
                min="0"
                value={formValues.minAmount || ''}
                onChange={(e) => handleFieldChange('minAmount', e.target.value)}
                className="w-[100px] h-8"
              />
              <Input
                type="number"
                placeholder="Max BTC"
                step="0.0001"
                min="0"
                value={formValues.maxAmount || ''}
                onChange={(e) => handleFieldChange('maxAmount', e.target.value)}
                className="w-[100px] h-8"
              />
            </>
          )}

          {/* Apply Button (only shown when not applying on change) */}
          {!applyOnChange && (
            <Button type="submit" size="sm" className="h-8">
              Apply
            </Button>
          )}
        </form>
      </CardContent>
    </Card>
  );
};

export default ComplianceFilterPanel;