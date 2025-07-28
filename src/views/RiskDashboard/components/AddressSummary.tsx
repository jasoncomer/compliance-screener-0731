import { useTheme } from "../../../context/ThemeContext";

interface AddressSummaryProps {
  inputAmount?: number;
  outputAmount?: number;
  balance?: number;
  isLoading?: boolean;
}

export function AddressSummary({
  inputAmount = 0,
  outputAmount = 0,
  balance = 0,
  isLoading = false
}: AddressSummaryProps) {
  const { theme } = useTheme();

  if (isLoading) {
    return (
      <div className={`rounded-2xl border p-4 h-full ${
        theme === 'dark' 
          ? 'bg-gray-800/50 border-gray-700' 
          : 'bg-gray-50 border-gray-200'
      }`}>
        <h4 className={`text-xl font-semibold mb-4 ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>Summary</h4>
        <div className="space-y-4">
          <div className="flex justify-between items-center py-2">
            <span className={`text-base ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>Input Amount:</span>
            <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-24 animate-pulse"></div>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className={`text-base ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>Output Amount:</span>
            <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-24 animate-pulse"></div>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className={`text-base ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>Balance:</span>
            <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-20 animate-pulse"></div>
          </div>
        </div>
      </div>
    )
  }

  const formatBitcoin = (value: number) => {
    if (value >= 1000) return `${(value / 1000).toFixed(3)}k BTC`;
    if (value >= 1) return `${value.toFixed(4)} BTC`;
    return `${value.toFixed(8)} BTC`;
  };

  return (
    <div className={`rounded-2xl border p-4 h-full ${
      theme === 'dark' 
        ? 'bg-gray-800/50 border-gray-700' 
        : 'bg-gray-50 border-gray-200'
    }`}>
      <h4 className={`text-xl font-semibold mb-4 ${
        theme === 'dark' ? 'text-white' : 'text-gray-900'
      }`}>Summary</h4>
      <div className="space-y-4">
        <div className="flex justify-between items-center py-2">
          <span className={`text-base ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>Input Amount:</span>
          <span className={`font-mono text-lg ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>{formatBitcoin(inputAmount)}</span>
        </div>
        <div className="flex justify-between items-center py-2">
          <span className={`text-base ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>Output Amount:</span>
          <span className={`font-mono text-lg ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>{formatBitcoin(outputAmount)}</span>
        </div>
        <div className="flex justify-between items-center py-2">
          <span className={`text-base ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>Balance:</span>
          <span className={`font-mono text-lg ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>{formatBitcoin(balance)}</span>
        </div>
      </div>
    </div>
  )
} 