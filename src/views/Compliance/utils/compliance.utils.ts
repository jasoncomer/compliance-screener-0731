import { EComplianceTransactionStatus } from '../../../typings/compliance';
import { getRiskScoreColor as getUnifiedRiskScoreColor, getRiskScoreClassName as getUnifiedRiskScoreClassName } from '../../../services/inputTransactionRiskService';

// Re-export unified risk calculation functions
export const getRiskScoreColor = getUnifiedRiskScoreColor;
export const getRiskScoreClassName = getUnifiedRiskScoreClassName;

// For Ant Design Tag component color prop
export const getComplianceReportStatusColor = (status: EComplianceTransactionStatus) => {
  switch (status) {
    case EComplianceTransactionStatus.UNASSIGNED:
      return "orange";
    case EComplianceTransactionStatus.UNREVIEWED:
      return "blue";
    case EComplianceTransactionStatus.IN_REVIEW:
      return "purple";
    case EComplianceTransactionStatus.HOLD:
      return "warning";
    case EComplianceTransactionStatus.APPROVED:
      return "success";
    case EComplianceTransactionStatus.CLOSED_WITH_NOTE:
      return "success";
    case EComplianceTransactionStatus.CLOSED_WITH_SAR:
      return "error";
    default:
      return "default";
  }
};

// For Tailwind CSS classes (used with Badge component)
export const getComplianceReportStatusClassName = (status: EComplianceTransactionStatus) => {
  switch (status) {
    case EComplianceTransactionStatus.UNASSIGNED:
      return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
    case EComplianceTransactionStatus.UNREVIEWED:
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
    case EComplianceTransactionStatus.IN_REVIEW:
      return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
    case EComplianceTransactionStatus.HOLD:
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
    case EComplianceTransactionStatus.APPROVED:
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    case EComplianceTransactionStatus.CLOSED_WITH_NOTE:
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    case EComplianceTransactionStatus.CLOSED_WITH_SAR:
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
  }
};