import { colors } from '../../../styles/variables';
import { ETransactionStatus } from '../../../typings/compliance';

export const getRiskScoreColor = (score: number): string => {
  if (score > 70) return colors.danger;
  if (score > 30) return colors.warning;
  return colors.successDark;
};

export const getStatusColor = (status: ETransactionStatus): string => {
  if (status === ETransactionStatus.IN_REVIEW) return colors.warningDark;
  if (status === ETransactionStatus.UNREVIEWED) return colors.primaryDark;
  if (status === ETransactionStatus.HOLD) return colors.dangerDark;
  if (status === ETransactionStatus.CLOSED_WITH_NOTE || status === ETransactionStatus.CLOSED_WITH_SAR) return colors.dangerDark;
  if (status === ETransactionStatus.APPROVED) return colors.successDark;
  return colors.black;
};