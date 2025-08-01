"use client"

import { useState } from "react"
import { D3SankeyDiagram } from "./D3SankeyDiagram"
import { EnhancedD3SankeyDiagram } from "./EnhancedD3SankeyDiagram"

interface FundsDataPoint {
  name: string
  value: number
  entityType: string
}

// Sample data for demonstration
const sampleIncomingData: FundsDataPoint[] = [
  { name: "Exchange A", value: 50000, entityType: "Exchange" },
  { name: "Exchange B", value: 30000, entityType: "Exchange" },
  { name: "Mining Pool", value: 15000, entityType: "Mining" },
  { name: "DeFi Protocol", value: 25000, entityType: "DeFi" },
  { name: "Gambling Site", value: 10000, entityType: "Gambling" },
]

const sampleOutgoingData: FundsDataPoint[] = [
  { name: "Exchange C", value: 40000, entityType: "Exchange" },
  { name: "NFT Marketplace", value: 20000, entityType: "NFT" },
  { name: "DeFi Protocol", value: 30000, entityType: "DeFi" },
  { name: "Gambling Site", value: 15000, entityType: "Gambling" },
  { name: "Mixer Service", value: 5000, entityType: "Mixer" },
]

export const SankeyExample = () => {
  const [useEnhanced, setUseEnhanced] = useState(true)
  const [enableZoom, setEnableZoom] = useState(true)
  const [enablePan, setEnablePan] = useState(true)

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-4 items-center">
        <h2 className="text-2xl font-bold">D3.js Sankey Diagram Examples</h2>
        
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
          
          {useEnhanced && (
            <>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={enableZoom}
                  onChange={(e) => setEnableZoom(e.target.checked)}
                  className="rounded"
                />
                <span>Enable Zoom</span>
              </label>
              
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={enablePan}
                  onChange={(e) => setEnablePan(e.target.checked)}
                  className="rounded"
                />
                <span>Enable Pan</span>
              </label>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-8">
        {useEnhanced ? (
          <EnhancedD3SankeyDiagram
            incomingData={sampleIncomingData}
            outgoingData={sampleOutgoingData}
            title="Enhanced D3 Sankey Diagram"
            width={1000}
            height={600}
            enableZoom={enableZoom}
            enablePan={enablePan}
          />
        ) : (
          <D3SankeyDiagram
            incomingData={sampleIncomingData}
            outgoingData={sampleOutgoingData}
            title="Basic D3 Sankey Diagram"
            width={1000}
            height={600}
          />
        )}
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Features:</h3>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>Pure D3.js implementation with d3-sankey</li>
          <li>TypeScript support with proper type definitions</li>
          <li>Interactive tooltips showing transaction details and risk scores</li>
          <li>Color-coded nodes and links based on entity types and risk scores</li>
          <li>Responsive design that adapts to container size</li>
          <li>Dark/light theme support</li>
          <li>Zoom and pan capabilities (enhanced version)</li>
          <li>Legend showing entity types with emojis</li>
        </ul>
      </div>
    </div>
  )
} 