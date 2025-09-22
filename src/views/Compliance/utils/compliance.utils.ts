import { colors } from '@/design-system/tokens'
import { EComplianceTransactionStatus } from '../../../typings/compliance';

export const getRiskScoreColor = (score: number): string => {
  if (score > 70) return colors.semantic.danger;
  if (score > 30) return colors.semantic.warning;
  return colors.semantic.successDark;
};

export const getComplianceReportStatusColor = (status: EComplianceTransactionStatus) => {
  switch (status) {
    case EComplianceTransactionStatus.CLOSED_WITH_NOTE:
    case EComplianceTransactionStatus.CLOSED_WITH_SAR:
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
    case EComplianceTransactionStatus.HOLD:
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
    case EComplianceTransactionStatus.APPROVED:
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
  }
};