import { colors } from '../../../styles/variables';
import { ETransactionStatus } from '../../../typings/compliance';

export const getRiskScoreColor = (score: number): string => {
  if (score > 70) return colors.danger;
  if (score > 40) return colors.warning;
  return colors.successDark;
};

export const getStatusColor = (status: ETransactionStatus): string => {
  if (status === ETransactionStatus.APPROVED) return colors.successDark;
  if (status === ETransactionStatus.HOLD) return colors.warningDark;
  if (status === ETransactionStatus.CLOSED_WITH_NOTE || status === ETransactionStatus.CLOSED_WITH_SAR) return colors.dangerDark;
  return colors.black;
};