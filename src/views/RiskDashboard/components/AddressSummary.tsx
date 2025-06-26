import { Card, Typography, Skeleton } from 'antd';
import { useTheme } from "../../../context/ThemeContext";
import { satsToBTC } from "../../../utils/crypto"

const { Title } = Typography;

interface AddressSummaryProps {
  balance?: number
  total_received?: number
  total_spent?: number
  script_type?: string
  firstBlock?: number
  lastBlock?: number
  isLoading?: boolean
}

export function AddressSummary({
  balance = 0,
  total_received = 0,
  total_spent = 0,
  script_type = 'Unknown',
  firstBlock,
  lastBlock,
  isLoading = false
}: AddressSummaryProps) {
  const { theme } = useTheme();

  if (isLoading) {
    return (
      <Card className={`${theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'} rounded-2xl h-full`}>
        <Title level={4} className={`${theme === 'light' ? 'text-gray-900' : 'text-white'} mb-6`}>Summary</Title>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 text-base">
          <div className="flex justify-between items-center">
            <span className={`${theme === 'light' ? 'text-gray-500' : 'text-gray-400'} text-base`}>Balance:</span>
            <Skeleton.Input active size="small" style={{ width: 100 }} />
          </div>
          <div className="flex justify-between items-center">
            <span className={`${theme === 'light' ? 'text-gray-500' : 'text-gray-400'} text-base`}>Script Type:</span>
            <Skeleton.Input active size="small" style={{ width: 80 }} />
          </div>
          <div className="flex justify-between items-center">
            <span className={`${theme === 'light' ? 'text-gray-500' : 'text-gray-400'} text-base`}>First block:</span>
            <Skeleton.Input active size="small" style={{ width: 80 }} />
          </div>
          <div className="flex justify-between items-center">
            <span className={`${theme === 'light' ? 'text-gray-500' : 'text-gray-400'} text-base`}>Total received:</span>
            <Skeleton.Input active size="small" style={{ width: 100 }} />
          </div>
          <div className="flex justify-between items-center">
            <span className={`${theme === 'light' ? 'text-gray-500' : 'text-gray-400'} text-base`}>Last block:</span>
            <Skeleton.Input active size="small" style={{ width: 80 }} />
          </div>
          <div className="flex justify-between items-center">
            <span className={`${theme === 'light' ? 'text-gray-500' : 'text-gray-400'} text-base`}>Total spent:</span>
            <Skeleton.Input active size="small" style={{ width: 100 }} />
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className={`${theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700'} rounded-2xl h-full`}>
      <Title level={4} className={`${theme === 'light' ? 'text-gray-900' : 'text-white'} mb-6`}>Summary</Title>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 text-base">
        <div className="flex justify-between items-center">
          <span className={`${theme === 'light' ? 'text-gray-500' : 'text-gray-400'} text-base`}>Balance:</span>
          <span className={`font-mono ${theme === 'light' ? 'text-gray-900' : 'text-white'} text-lg`}>{satsToBTC(balance)} BTC</span>
        </div>
        <div className="flex justify-between items-center">
          <span className={`${theme === 'light' ? 'text-gray-500' : 'text-gray-400'} text-base`}>Script Type:</span>
          <span className={`font-mono ${theme === 'light' ? 'text-gray-900' : 'text-white'} text-lg`}>{script_type}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className={`${theme === 'light' ? 'text-gray-500' : 'text-gray-400'} text-base`}>First block:</span>
          <span className={`font-mono ${theme === 'light' ? 'text-gray-900' : 'text-white'} text-lg`}>{firstBlock || 'N/A'}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className={`${theme === 'light' ? 'text-gray-500' : 'text-gray-400'} text-base`}>Total received:</span>
          <span className={`font-mono ${theme === 'light' ? 'text-gray-900' : 'text-white'} text-lg`}>{satsToBTC(total_received)} BTC</span>
        </div>
        <div className="flex justify-between items-center">
          <span className={`${theme === 'light' ? 'text-gray-500' : 'text-gray-400'} text-base`}>Last block:</span>
          <span className={`font-mono ${theme === 'light' ? 'text-gray-900' : 'text-white'} text-lg`}>{lastBlock || 'N/A'}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className={`${theme === 'light' ? 'text-gray-500' : 'text-gray-400'} text-base`}>Total spent:</span>
          <span className={`font-mono ${theme === 'light' ? 'text-gray-900' : 'text-white'} text-lg`}>{satsToBTC(total_spent)} BTC</span>
        </div>
      </div>
    </Card>
  )
} 