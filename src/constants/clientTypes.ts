/**
 * Client type constants for the frontend
 */
export enum ClientType {
  INDIVIDUAL = 'Individual',
  C_CORP = 'C-Corp',
  S_CORP = 'S-Corp',
  LLC = 'LLC',
  PARTNERSHIP = 'Partnership',
  TRUST = 'Trust',
  FOUNDATION = 'Foundation',
  EXCHANGE = 'Exchange',
  VASP = 'VASP',
  OTHER = 'Other'
}

export const CLIENT_TYPE_OPTIONS = [
  { value: ClientType.INDIVIDUAL, label: 'Individual' },
  { value: ClientType.C_CORP, label: 'C-Corporation' },
  { value: ClientType.S_CORP, label: 'S-Corporation' },
  { value: ClientType.LLC, label: 'Limited Liability Company' },
  { value: ClientType.PARTNERSHIP, label: 'Partnership' },
  { value: ClientType.TRUST, label: 'Trust' },
  { value: ClientType.FOUNDATION, label: 'Foundation' },
  { value: ClientType.EXCHANGE, label: 'Exchange' },
  { value: ClientType.VASP, label: 'Virtual Asset Service Provider' },
  { value: ClientType.OTHER, label: 'Other' }
];

/**
 * Get styling configuration for different client types
 */
export const getClientTypeStyle = (clientType: string) => {
  switch (clientType) {
    case ClientType.INDIVIDUAL:
      return {
        bgColor: 'bg-blue-100 dark:bg-blue-900/30',
        textColor: 'text-blue-700 dark:text-blue-300',
        icon: '👤'
      };
    case ClientType.C_CORP:
    case ClientType.S_CORP:
      return {
        bgColor: 'bg-green-100 dark:bg-green-900/30',
        textColor: 'text-green-700 dark:text-green-300',
        icon: '🏢'
      };
    case ClientType.LLC:
      return {
        bgColor: 'bg-purple-100 dark:bg-purple-900/30',
        textColor: 'text-purple-700 dark:text-purple-300',
        icon: '🏛️'
      };
    case ClientType.PARTNERSHIP:
      return {
        bgColor: 'bg-orange-100 dark:bg-orange-900/30',
        textColor: 'text-orange-700 dark:text-orange-300',
        icon: '🤝'
      };
    case ClientType.TRUST:
    case ClientType.FOUNDATION:
      return {
        bgColor: 'bg-indigo-100 dark:bg-indigo-900/30',
        textColor: 'text-indigo-700 dark:text-indigo-300',
        icon: '🏛️'
      };
    case ClientType.EXCHANGE:
    case ClientType.VASP:
      return {
        bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
        textColor: 'text-yellow-700 dark:text-yellow-300',
        icon: '💱'
      };
    case ClientType.OTHER:
    default:
      return {
        bgColor: 'bg-gray-100 dark:bg-gray-800',
        textColor: 'text-gray-600 dark:text-gray-400',
        icon: '📋'
      };
  }
};