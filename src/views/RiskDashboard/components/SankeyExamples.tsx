"use client"

import { useState } from "react"
import { EnhancedD3SankeyDiagram } from "./EnhancedD3SankeyDiagram"

interface ExampleData {
  name: string
  description: string
  incomingData: { name: string; value: number; entityType: string }[]
  outgoingData: { name: string; value: number; entityType: string }[]
}

const exampleScenarios: ExampleData[] = [
  {
    name: "Exchange Wallet",
    description: "High-volume exchange wallet with multiple incoming and outgoing flows",
    incomingData: [
      { name: "Binance", value: 2500000, entityType: "Exchange" },
      { name: "Coinbase", value: 1800000, entityType: "Exchange" },
      { name: "Kraken", value: 1200000, entityType: "Exchange" },
      { name: "Mining Pool", value: 800000, entityType: "Mining" },
      { name: "DeFi Protocol", value: 500000, entityType: "DeFi" },
    ],
    outgoingData: [
      { name: "User Wallet 1", value: 1500000, entityType: "Wallet" },
      { name: "User Wallet 2", value: 1200000, entityType: "Wallet" },
      { name: "DeFi Protocol", value: 800000, entityType: "DeFi" },
      { name: "NFT Marketplace", value: 600000, entityType: "NFT" },
      { name: "Gambling Site", value: 400000, entityType: "Gambling" },
      { name: "Mixer Service", value: 200000, entityType: "Mixer" },
    ]
  },
  {
    name: "Mining Pool",
    description: "Mining pool receiving block rewards and distributing to miners",
    incomingData: [
      { name: "Block Reward", value: 5000000, entityType: "Mining" },
      { name: "Transaction Fees", value: 800000, entityType: "Mining" },
    ],
    outgoingData: [
      { name: "Miner 1", value: 1200000, entityType: "Mining" },
      { name: "Miner 2", value: 980000, entityType: "Mining" },
      { name: "Miner 3", value: 850000, entityType: "Mining" },
      { name: "Miner 4", value: 720000, entityType: "Mining" },
      { name: "Miner 5", value: 650000, entityType: "Mining" },
      { name: "Pool Fee", value: 580000, entityType: "Mining" },
    ]
  },
  {
    name: "DeFi User",
    description: "Active DeFi user with complex yield farming flows",
    incomingData: [
      { name: "Exchange", value: 500000, entityType: "Exchange" },
      { name: "Yield Farming", value: 150000, entityType: "DeFi" },
      { name: "Liquidity Mining", value: 80000, entityType: "DeFi" },
    ],
    outgoingData: [
      { name: "Uniswap", value: 200000, entityType: "DeFi" },
      { name: "Compound", value: 150000, entityType: "DeFi" },
      { name: "Aave", value: 120000, entityType: "DeFi" },
      { name: "SushiSwap", value: 80000, entityType: "DeFi" },
      { name: "Gas Fees", value: 50000, entityType: "DeFi" },
    ]
  },
  {
    name: "Gambling Site",
    description: "Gambling platform with high-risk transaction patterns",
    incomingData: [
      { name: "User Deposits", value: 800000, entityType: "Gambling" },
      { name: "Exchange", value: 300000, entityType: "Exchange" },
    ],
    outgoingData: [
      { name: "User Withdrawals", value: 600000, entityType: "Gambling" },
      { name: "Mixer Service", value: 200000, entityType: "Mixer" },
      { name: "Exchange", value: 150000, entityType: "Exchange" },
      { name: "Platform Fee", value: 150000, entityType: "Gambling" },
    ]
  },
  {
    name: "NFT Trader",
    description: "Active NFT trader with marketplace interactions",
    incomingData: [
      { name: "OpenSea Sales", value: 400000, entityType: "NFT" },
      { name: "Exchange", value: 200000, entityType: "Exchange" },
      { name: "NFT Royalties", value: 50000, entityType: "NFT" },
    ],
    outgoingData: [
      { name: "OpenSea Purchases", value: 350000, entityType: "NFT" },
      { name: "Gas Fees", value: 80000, entityType: "NFT" },
      { name: "Exchange", value: 120000, entityType: "Exchange" },
      { name: "Artist Payments", value: 50000, entityType: "NFT" },
    ]
  },
  {
    name: "Mixer Service",
    description: "Privacy-focused mixer with complex flow patterns",
    incomingData: [
      { name: "User 1", value: 300000, entityType: "Mixer" },
      { name: "User 2", value: 250000, entityType: "Mixer" },
      { name: "User 3", value: 200000, entityType: "Mixer" },
      { name: "Gambling Site", value: 150000, entityType: "Mixer" },
    ],
    outgoingData: [
      { name: "User 1 (Mixed)", value: 280000, entityType: "Mixer" },
      { name: "User 2 (Mixed)", value: 230000, entityType: "Mixer" },
      { name: "User 3 (Mixed)", value: 180000, entityType: "Mixer" },
      { name: "Exchange", value: 120000, entityType: "Exchange" },
      { name: "Service Fee", value: 90000, entityType: "Mixer" },
    ]
  }
]

export const SankeyExamples = () => {
  const [selectedExample, setSelectedExample] = useState(0)
  const [useEnhanced, setUseEnhanced] = useState(true)

  const currentExample = exampleScenarios[selectedExample]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <h2 className="text-2xl font-bold">Sankey Diagram Examples</h2>
        
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={useEnhanced}
              onChange={(e) => setUseEnhanced(e.target.checked)}
              className="rounded"
            />
            <span>Use Enhanced Version</span>
          </label>
        </div>
      </div>

      {/* Example Selector */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {exampleScenarios.map((example, index) => (
          <button
            key={index}
            onClick={() => setSelectedExample(index)}
            className={`p-3 rounded-lg border text-left transition-colors ${
              selectedExample === index
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            <div className="font-semibold text-sm">{example.name}</div>
            <div className="text-xs text-gray-500 mt-1">
              {example.incomingData.length + example.outgoingData.length} flows
            </div>
          </button>
        ))}
      </div>

      {/* Selected Example Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
        <h3 className="font-semibold text-lg mb-2">{currentExample.name}</h3>
        <p className="text-gray-600 dark:text-gray-300 mb-3">{currentExample.description}</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-semibold mb-2">Incoming Flows:</h4>
            <ul className="space-y-1">
              {currentExample.incomingData.map((item, index) => (
                <li key={index} className="flex justify-between">
                  <span>{item.name}</span>
                  <span className="font-mono">${(item.value / 1000).toFixed(0)}k</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Outgoing Flows:</h4>
            <ul className="space-y-1">
              {currentExample.outgoingData.map((item, index) => (
                <li key={index} className="flex justify-between">
                  <span>{item.name}</span>
                  <span className="font-mono">${(item.value / 1000).toFixed(0)}k</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Sankey Diagram */}
      <div className="border rounded-lg overflow-hidden">
        {useEnhanced ? (
          <EnhancedD3SankeyDiagram
            incomingData={currentExample.incomingData}
            outgoingData={currentExample.outgoingData}
            title={`${currentExample.name} - Flow Analysis`}
            width={1000}
            height={600}
            enableZoom={true}
            enablePan={true}
          />
        ) : (
          <div className="p-6">
            <h3 className="text-xl font-semibold mb-4">{currentExample.name} - Flow Analysis</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              This example shows how the Sankey diagram would look with real transaction data.
              In the actual implementation, this would be populated with real blockchain data.
            </p>
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded text-center">
              <p className="text-gray-500">Enhanced version would show interactive Sankey diagram here</p>
            </div>
          </div>
        )}
      </div>

      {/* Usage Instructions */}
      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">How to Use:</h3>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>Select different example scenarios to see various flow patterns</li>
          <li>Toggle between basic and enhanced versions</li>
          <li>Hover over nodes and links to see detailed information</li>
          <li>Use zoom and pan controls in enhanced version</li>
          <li>Colors represent risk levels: Red (high risk) to Green (low risk)</li>
        </ul>
      </div>
    </div>
  )
} 