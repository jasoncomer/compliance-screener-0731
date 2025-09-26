import * as React from "react"

import { cn } from "@/lib/utils"

interface BlockchainLoaderProps {
  variant?: 'network' | 'blocks' | 'transaction' | 'skeleton'
  message?: string
  showProgress?: boolean
  progress?: number
  size?: 'sm' | 'md' | 'lg' | 'full'
  className?: string
}

const sizeClasses = {
  sm: "w-32 h-32",
  md: "w-48 h-48",
  lg: "w-64 h-64",
  full: "w-full h-full min-h-[200px]"
}

const HexagonNetwork: React.FC<{ size: string }> = ({ size }) => {
  return (
    <div className={cn("relative flex items-center justify-center", size)}>
      <svg
        viewBox="0 0 200 200"
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="hexGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f97316" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#ea580c" stopOpacity="1" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Central hexagon */}
        <g className="animate-pulse">
          <polygon
            points="100,40 140,65 140,115 100,140 60,115 60,65"
            fill="url(#hexGradient)"
            stroke="#f97316"
            strokeWidth="2"
            filter="url(#glow)"
            className="opacity-90"
          />
        </g>

        {/* Surrounding hexagons with staggered animation */}
        {[
          { x: 50, y: 20, delay: "0ms" },
          { x: 150, y: 20, delay: "100ms" },
          { x: 150, y: 120, delay: "200ms" },
          { x: 100, y: 160, delay: "300ms" },
          { x: 50, y: 120, delay: "400ms" },
          { x: 0, y: 60, delay: "500ms" },
        ].map((hex, i) => (
          <g key={i} className="animate-pulse" style={{ animationDelay: hex.delay }}>
            <polygon
              points={`${hex.x + 20},${hex.y} ${hex.x + 40},${hex.y + 12} ${hex.x + 40},${hex.y + 37} ${hex.x + 20},${hex.y + 50} ${hex.x},${hex.y + 37} ${hex.x},${hex.y + 12}`}
              fill="none"
              stroke="#f97316"
              strokeWidth="1"
              className="opacity-40"
            />
          </g>
        ))}

        {/* Connecting lines with flow animation */}
        <g className="opacity-60">
          <line x1="100" y1="90" x2="60" y2="45" stroke="#f97316" strokeWidth="1" strokeDasharray="5,5">
            <animate attributeName="stroke-dashoffset" from="0" to="-10" dur="1s" repeatCount="indefinite" />
          </line>
          <line x1="100" y1="90" x2="140" y2="45" stroke="#f97316" strokeWidth="1" strokeDasharray="5,5">
            <animate attributeName="stroke-dashoffset" from="0" to="-10" dur="1s" repeatCount="indefinite" />
          </line>
          <line x1="100" y1="90" x2="140" y2="135" stroke="#f97316" strokeWidth="1" strokeDasharray="5,5">
            <animate attributeName="stroke-dashoffset" from="0" to="-10" dur="1.2s" repeatCount="indefinite" />
          </line>
          <line x1="100" y1="90" x2="60" y2="135" stroke="#f97316" strokeWidth="1" strokeDasharray="5,5">
            <animate attributeName="stroke-dashoffset" from="0" to="-10" dur="1.4s" repeatCount="indefinite" />
          </line>
        </g>

        {/* Data flow dots */}
        {[0, 1, 2].map((i) => (
          <circle key={i} r="2" fill="#f97316" className="opacity-80">
            <animateMotion
              dur={`${2 + i * 0.5}s`}
              repeatCount="indefinite"
              path="M100,90 L60,45 M100,90 L140,45 M100,90 L140,135"
            />
          </circle>
        ))}
      </svg>
    </div>
  )
}

const BlockStack: React.FC<{ size: string }> = ({ size }) => {
  return (
    <div className={cn("relative flex items-center justify-center", size)}>
      <div className="relative">
        {/* Stacking blocks animation */}
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="absolute w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-lg animate-bounce"
            style={{
              animationDelay: `${i * 200}ms`,
              animationDuration: '1.5s',
              top: `${i * -20}px`,
              left: `${i * 10}px`,
              transform: `rotate(${i * 5}deg)`,
            }}
          >
            <div className="absolute inset-1 bg-gradient-to-br from-orange-400 to-orange-500 rounded-md opacity-50" />
            <div className="absolute inset-0 flex items-center justify-center text-white font-mono text-xs">
              #{i + 1}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const TransactionFlow: React.FC<{ size: string }> = ({ size }) => {
  return (
    <div className={cn("relative flex items-center justify-center", size)}>
      <div className="relative w-full max-w-xs">
        <div className="flex items-center justify-between">
          {/* Sender */}
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 animate-pulse" />

          {/* Transaction flow */}
          <div className="flex-1 mx-4 relative h-1">
            <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 rounded-full" />
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-orange-500 to-green-500 rounded-full animate-shimmer" />
            {/* Moving dots */}
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-orange-500 rounded-full animate-slide"
                style={{
                  animationDelay: `${i * 0.3}s`,
                  animationDuration: '1.5s',
                }}
              />
            ))}
          </div>

          {/* Receiver */}
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-green-600 animate-pulse" style={{ animationDelay: '500ms' }} />
        </div>
      </div>
    </div>
  )
}

const SkeletonLoader: React.FC<{ size: string }> = ({ size }) => {
  return (
    <div className={cn("space-y-4", size)}>
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
        <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" style={{ animationDelay: '100ms' }} />
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-5/6" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-4/6" />
      </div>
    </div>
  )
}

export const BlockchainLoader: React.FC<BlockchainLoaderProps> = ({
  variant = 'network',
  message,
  showProgress = false,
  progress = 0,
  size = 'md',
  className,
}) => {
  const renderLoader = () => {
    switch (variant) {
      case 'blocks':
        return <BlockStack size={sizeClasses[size]} />
      case 'transaction':
        return <TransactionFlow size={sizeClasses[size]} />
      case 'skeleton':
        return <SkeletonLoader size={sizeClasses[size]} />
      case 'network':
      default:
        return <HexagonNetwork size={sizeClasses[size]} />
    }
  }

  return (
    <div className={cn("flex flex-col items-center justify-center gap-4 p-8", className)}>
      {renderLoader()}

      {message && (
        <div className="text-center space-y-2">
          <p className="text-sm font-medium text-foreground animate-pulse">
            {message}
          </p>
          {showProgress && (
            <div className="w-48 bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-orange-500 to-orange-600 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
      )}

      {/* Meerkat mascot hint */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="inline-block w-4 h-4 rounded-full bg-orange-500/20 animate-pulse" />
        <span>Fetching blockchain data...</span>
      </div>
    </div>
  )
}

// Page-level loader
export const BlockchainPageLoader: React.FC<{ message?: string }> = ({ message = "Loading blockchain data..." }) => {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <BlockchainLoader variant="network" message={message} size="lg" />
    </div>
  )
}

// Inline loader for smaller components
export const BlockchainInlineLoader: React.FC<{ className?: string }> = ({ className }) => {
  return <BlockchainLoader variant="network" size="sm" className={className} />
}

// Export variants for specific use cases
export const TransactionLoader: React.FC<{ txid?: string }> = ({ txid }) => {
  return (
    <BlockchainLoader
      variant="transaction"
      message={txid ? `Loading transaction ${txid.slice(0, 8)}...` : "Loading transaction details..."}
      size="md"
    />
  )
}

export const AddressLoader: React.FC<{ address?: string }> = ({ address }) => {
  return (
    <BlockchainLoader
      variant="network"
      message={address ? `Analyzing address ${address.slice(0, 8)}...` : "Loading address data..."}
      size="md"
    />
  )
}

export const BlockLoader: React.FC<{ blockNumber?: number }> = ({ blockNumber }) => {
  return (
    <BlockchainLoader
      variant="blocks"
      message={blockNumber ? `Loading block #${blockNumber}...` : "Loading block data..."}
      size="md"
    />
  )
}

// Add required CSS animations to your global styles or Tailwind config
const styles = `
@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

@keyframes slide {
  0% { left: -10%; opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { left: 110%; opacity: 0; }
}

.animate-shimmer {
  animation: shimmer 2s infinite;
}

.animate-slide {
  animation: slide 1.5s infinite;
}
`

// Inject styles
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style')
  styleElement.innerHTML = styles
  document.head.appendChild(styleElement)
}