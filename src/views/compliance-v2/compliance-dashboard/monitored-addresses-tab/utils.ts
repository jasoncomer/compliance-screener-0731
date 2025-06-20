export const getCategoryColor = (category: string) => {
  switch (category) {
    case "CRITICAL":
      return "bg-red-500 text-white"
    case "HIGH_RISK":
      return "bg-orange-500 text-white"
    case "MEDIUM":
      return "bg-yellow-500 text-black"
    case "LOW":
      return "bg-green-500 text-white"
    default:
      return "bg-gray-500 text-white"
  }
}

export const getStatusColor = (status: string) => {
  switch (status) {
    case "ACTIVE":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
    case "PAUSED":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
    case "INACTIVE":
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
  }
}

export const getRiskScoreColor = (score: number) => {
  if (score >= 90) return "bg-red-500"
  if (score >= 70) return "bg-orange-500"
  if (score >= 50) return "bg-yellow-500"
  return "bg-green-500"
}

export const getBlockchainColor = (blockchain: string) => {
  switch (blockchain) {
    case "Bitcoin":
      return "bg-orange-500"
    case "Ethereum":
      return "bg-blue-500"
    case "Litecoin":
      return "bg-gray-500"
    default:
      return "bg-purple-500"
  }
}

export const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text)
}