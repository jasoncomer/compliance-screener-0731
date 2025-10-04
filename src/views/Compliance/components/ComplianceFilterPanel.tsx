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
  showReviewDateRangeFilter?: boolean;
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
  showReviewDateRangeFilter = false,
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
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});

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

  // Validate form values
  const validateFormValues = (values: any): {isValid: boolean, errors: {[key: string]: string}} => {
    const errors: {[key: string]: string} = {};
    
    console.log('Validating form values:', values);
    
    // Validate risk score range
    if (values.minRiskLevel && values.maxRiskLevel) {
      const minRisk = parseFloat(values.minRiskLevel);
      const maxRisk = parseFloat(values.maxRiskLevel);
      
      console.log('Risk validation:', { minRisk, maxRisk, minRiskLevel: values.minRiskLevel, maxRiskLevel: values.maxRiskLevel });
      
      if (!isNaN(minRisk) && !isNaN(maxRisk) && minRisk > maxRisk) {
        errors.riskRange = 'Minimum risk score cannot be greater than maximum risk score';
      }
    }
    
    // Validate individual risk score values
    if (values.minRiskLevel) {
      const minRisk = parseFloat(values.minRiskLevel);
      if (isNaN(minRisk) || minRisk < 0 || minRisk > 100) {
        errors.minRiskLevel = 'Minimum risk score must be between 0 and 100';
      }
    }
    
    if (values.maxRiskLevel) {
      const maxRisk = parseFloat(values.maxRiskLevel);
      if (isNaN(maxRisk) || maxRisk < 0 || maxRisk > 100) {
        errors.maxRiskLevel = 'Maximum risk score must be between 0 and 100';
      }
    }
    
    // Validate amount range
    if (values.minAmount && values.maxAmount) {
      const minAmount = parseFloat(values.minAmount);
      const maxAmount = parseFloat(values.maxAmount);
      
      console.log('Amount validation:', { minAmount, maxAmount, minAmountRaw: values.minAmount, maxAmountRaw: values.maxAmount });
      
      if (!isNaN(minAmount) && !isNaN(maxAmount) && minAmount > maxAmount) {
        errors.amountRange = 'Minimum amount cannot be greater than maximum amount';
      }
    }
    
    // Validate individual amount values
    if (values.minAmount) {
      const minAmount = parseFloat(values.minAmount);
      if (isNaN(minAmount) || minAmount < 0) {
        errors.minAmount = 'Minimum amount must be a positive number';
      }
    }
    
    if (values.maxAmount) {
      const maxAmount = parseFloat(values.maxAmount);
      if (isNaN(maxAmount) || maxAmount < 0) {
        errors.maxAmount = 'Maximum amount must be a positive number';
      }
    }
    
    console.log('Validation result:', { isValid: Object.keys(errors).length === 0, errors });
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  };

  // Process form values into TransactionFilters
  const processFilterValues = (values: any): TransactionFilters => {
    const { dateFrom, dateTo, reviewDateFrom, reviewDateTo, minAmount, maxAmount, minRiskLevel, maxRiskLevel, ...rest } = values;
    const filters: TransactionFilters = { ...rest };

    // Transaction timestamp date range filter
    if (dateFrom && dateTo) {
      const startDate = new Date(dateFrom);
      const endDate = new Date(dateTo);
      endDate.setHours(23, 59, 59, 999); // End of day

      filters.timestamp = {
        from: startDate.toISOString(),
        to: endDate.toISOString()
      };
    }

    // Review timestamp date range filter
    if (reviewDateFrom && reviewDateTo) {
      const startDate = new Date(reviewDateFrom);
      const endDate = new Date(reviewDateTo);
      endDate.setHours(23, 59, 59, 999); // End of day

      filters.reviewTimestamp = {
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

    // Risk level filters - pass through as numeric values
    if (minRiskLevel) {
      filters.minRiskLevel = parseFloat(minRiskLevel);
    }

    if (maxRiskLevel) {
      filters.maxRiskLevel = parseFloat(maxRiskLevel);
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

    // Validate the new values
    const validation = validateFormValues(newValues);
    setValidationErrors(validation.errors);

    console.log('🔍 ComplianceFilterPanel - Field change validation:', {
      field,
      value,
      newValues,
      validation,
      applyOnChange
    });

    if (applyOnChange && validation.isValid) {
      const filters = processFilterValues(newValues);
      console.log('🔍 ComplianceFilterPanel - Applying filters after validation:', filters);
      console.log('🔍 ComplianceFilterPanel - Calling onFilterChange with:', filters);
      onFilterChange(filters);
    } else if (applyOnChange && !validation.isValid) {
      console.log('🔍 ComplianceFilterPanel - Validation failed, not applying filters:', validation.errors);
    }
  };

  // Handle filter submit (for manual apply mode)
  const handleFilterSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    const validation = validateFormValues(formValues);
    setValidationErrors(validation.errors);
    
    console.log('Filter submit validation:', {
      formValues,
      validation,
      applyOnChange
    });
    
    if (validation.isValid) {
      const filters = processFilterValues(formValues);
      console.log('Applying filters after submit validation:', filters);
      onFilterChange(filters);
    } else {
      console.log('Submit validation failed, not applying filters:', validation.errors);
    }
  };

  // Clear all filters
  const handleClearFilters = () => {
    setFormValues({});
    setValidationErrors({});
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
          className="flex flex-wrap gap-4"
        >
          {/* Basic Info Group */}
          {(showStatusFilter || showBlockchainFilter || showClientIdFilter) && (
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-800/50">
              <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Basic Information</div>
              <div className="flex flex-wrap gap-3">
                {/* Status Select */}
                {showStatusFilter && (
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Status</label>
                    <div>
                      <Select
                        value={formValues.status || ''}
                        onValueChange={(value) => handleFieldChange('status', value)}
                      >
                        <SelectTrigger className="w-[150px] h-8">
                          <SelectValue placeholder="Select status" />
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
                  </div>
                )}

                {/* Blockchain */}
                {showBlockchainFilter && (
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Blockchain</label>
                    <div>
                      <Select
                        value={formValues.blockchain || ''}
                        onValueChange={(value) => handleFieldChange('blockchain', value)}
                      >
                        <SelectTrigger className="w-[150px] h-8">
                          <SelectValue placeholder="Select blockchain" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableBlockchains.map(blockchain => (
                            <SelectItem key={blockchain} value={blockchain}>
                              {blockchain}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {/* Client ID */}
                {showClientIdFilter && (
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Client ID</label>
                    <Input
                      placeholder="e.g. client-123, abc-corp"
                      value={formValues.clientId || ''}
                      onChange={(e) => handleFieldChange('clientId', e.target.value)}
                      className="w-[150px] h-8"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Assignment Group */}
          {(showAssignedToFilter || showCounterpartyEntityFilter || showTransactionIdFilter) && (
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-800/50">
              <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Assignment & Details</div>
              <div className="flex flex-wrap gap-3">
                {/* Assigned To Select */}
                {showAssignedToFilter && (
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Assigned To</label>
                    <div>
                      <Select
                        value={formValues.assignedTo || ''}
                        onValueChange={(value) => handleFieldChange('assignedTo', value)}
                      >
                        <SelectTrigger className="w-[140px] h-8">
                          <SelectValue placeholder="Select reviewer" />
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
                  </div>
                )}

                {/* Counterparty Entity */}
                {showCounterpartyEntityFilter && (
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Counterparty Entity</label>
                    <Input
                      placeholder="e.g. binance, coinbase"
                      value={formValues.counterpartyEntity || ''}
                      onChange={(e) => handleFieldChange('counterpartyEntity', e.target.value)}
                      className="w-[180px] h-8"
                    />
                  </div>
                )}

                {/* Transaction ID */}
                {showTransactionIdFilter && (
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Transaction ID</label>
                    <Input
                      placeholder="e.g. abc123def456"
                      value={formValues.txId || ''}
                      onChange={(e) => handleFieldChange('txId', e.target.value)}
                      className="w-[200px] h-8"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Transaction Timestamp Date Range Group */}
          {showDateRangeFilter && (
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-800/50">
              <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Transaction Timestamp</div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400">From / To</label>
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
              </div>
            </div>
          )}

          {/* Last Updated Date Range Group */}
          {showReviewDateRangeFilter && (
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-800/50">
              <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Last Updated</div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400">From / To</label>
                <div className="flex gap-1">
                  <Input
                    type="date"
                    value={formValues.reviewDateFrom || ''}
                    onChange={(e) => handleFieldChange('reviewDateFrom', e.target.value)}
                    className="w-[140px] h-8"
                  />
                  <Input
                    type="date"
                    value={formValues.reviewDateTo || ''}
                    onChange={(e) => handleFieldChange('reviewDateTo', e.target.value)}
                    className="w-[140px] h-8"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Risk Score Group */}
          {showRiskLevelFilter && (
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-800/50">
              <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Risk Score</div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Min / Max</label>
                <div className="flex gap-1">
                  <Input
                    type="number"
                    placeholder="0"
                    min="0"
                    max="100"
                    value={formValues.minRiskLevel || ''}
                    onChange={(e) => handleFieldChange('minRiskLevel', e.target.value)}
                    className={`w-[100px] h-8 ${validationErrors.minRiskLevel ? 'border-red-500' : ''}`}
                  />
                  <Input
                    type="number"
                    placeholder="100"
                    min="0"
                    max="100"
                    value={formValues.maxRiskLevel || ''}
                    onChange={(e) => handleFieldChange('maxRiskLevel', e.target.value)}
                    className={`w-[100px] h-8 ${validationErrors.maxRiskLevel ? 'border-red-500' : ''}`}
                  />
                </div>
                {(validationErrors.minRiskLevel || validationErrors.maxRiskLevel || validationErrors.riskRange) && (
                  <div className="text-xs text-red-500">
                    {validationErrors.riskRange || validationErrors.minRiskLevel || validationErrors.maxRiskLevel}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Amount Group */}
          {showAmountFilter && (
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-800/50">
              <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Amount (BTC)</div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Min / Max</label>
                <div className="flex gap-1">
                  <Input
                    type="number"
                    placeholder="0.001"
                    step="0.0001"
                    min="0"
                    value={formValues.minAmount || ''}
                    onChange={(e) => handleFieldChange('minAmount', e.target.value)}
                    className={`w-[100px] h-8 ${validationErrors.minAmount ? 'border-red-500' : ''}`}
                  />
                  <Input
                    type="number"
                    placeholder="1.0"
                    step="0.0001"
                    min="0"
                    value={formValues.maxAmount || ''}
                    onChange={(e) => handleFieldChange('maxAmount', e.target.value)}
                    className={`w-[100px] h-8 ${validationErrors.maxAmount ? 'border-red-500' : ''}`}
                  />
                </div>
                {(validationErrors.minAmount || validationErrors.maxAmount || validationErrors.amountRange) && (
                  <div className="text-xs text-red-500">
                    {validationErrors.amountRange || validationErrors.minAmount || validationErrors.maxAmount}
                  </div>
                )}
              </div>
            </div>
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