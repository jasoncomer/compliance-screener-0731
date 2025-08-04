"use client"

import type { FC } from "react"
import { useMemo } from "react"
import { ResponsiveContainer, Sankey, Tooltip, Layer } from "recharts"
import { riskScores } from "../../../lib/risk-scores"
import { getColorForEntityType, getEmojiForEntityType } from "../../../lib/entity-types"
import { useTheme } from "../../../context/ThemeContext"

interface FundsDataPoint {
  name: string
  value: number
  entityType: string
  cospendId?: string
  addressCount?: number
}

interface CombinedFundsFlowProps {
  incomingData: FundsDataPoint[]
  outgoingData: FundsDataPoint[]
  title?: string
}

const DEFAULT_COLOR = "hsl(240, 5%, 80%)" // Default gray for fallback

const formatCurrency = (value: number) => {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}k`
  return `$${value.toFixed(2)}`
}

const getColorFromRisk = (score: number | undefined) => {
  if (score === undefined) return DEFAULT_COLOR
  const hue = (1 - score / 100) * 120 // 0=Red, 120=Green
  return `hsl(${hue}, 70%, 50%)`
}

const CustomSankeyNode = (props: any) => {
  const { x, y, width, height, payload } = props

  const color = payload && typeof payload.color === "string" ? payload.color : DEFAULT_COLOR
  const nodeName = payload && typeof payload.name === "string" ? payload.name : ""

  // Make central "Wallet" node wider but don't modify its height
  let nodeWidth = width
  if (nodeName === "Wallet") {
    nodeWidth = Math.max(width, 30)
  }

  if (nodeWidth <= 0 || height <= 0) {
    return <rect x={0} y={0} width={1} height={1} fill="transparent" />
  }

  return <rect x={x} y={y} width={nodeWidth} height={height} fill={color} fillOpacity="0.9" rx="2" ry="2" />
}

const CustomSankeyLink = (props: any) => {
  const {
    sourceX: baseSourceX,
    sourceY: baseSourceY,
    sourceControlX: baseSourceControlX,
    targetX: baseTargetX,
    targetY: baseTargetY,
    targetControlX: baseTargetControlX,
    linkWidth: baseLinkWidth,
    payload,
  } = props

  const sourceX = typeof baseSourceX === "number" && !isNaN(baseSourceX) ? baseSourceX : 0
  const sourceY = typeof baseSourceY === "number" && !isNaN(baseSourceY) ? baseSourceY : 0
  const sourceControlX =
    typeof baseSourceControlX === "number" && !isNaN(baseSourceControlX) ? baseSourceControlX : sourceX
  const targetX = typeof baseTargetX === "number" && !isNaN(baseTargetX) ? baseTargetX : 0
  const targetY = typeof baseTargetY === "number" && !isNaN(baseTargetY) ? baseTargetY : 0
  const targetControlX =
    typeof baseTargetControlX === "number" && !isNaN(baseTargetControlX) ? baseTargetControlX : targetX
  const linkWidth = typeof baseLinkWidth === "number" && !isNaN(baseLinkWidth) && baseLinkWidth > 0 ? baseLinkWidth : 1

  const color = payload && typeof payload.color === "string" ? payload.color : DEFAULT_COLOR

  return (
    <Layer>
      <path
        d={`M${sourceX},${sourceY}C${sourceControlX},${sourceY},${targetControlX},${targetY},${targetX},${targetY}`}
        fill="none"
        stroke={color}
        strokeWidth={linkWidth}
        strokeOpacity={0.5}
      />
    </Layer>
  )
}

export const CombinedFundsFlow = ({ incomingData, outgoingData, title }: CombinedFundsFlowProps) => {
  const { theme } = useTheme();
  
  const { nodes, links, uniqueEntityTypes } = useMemo(() => {
    const nodeMap = new Map<string, number>()
    const currentNodes: { name: string; color: string; riskScore?: number; entityType: string; cospendId?: string; addressCount?: number }[] = []
    const currentLinks: {
      source: number
      target: number
      value: number
      label: string
      color: string
      riskScore?: number
      addressCount?: number
    }[] = []
    const entityTypes = new Set<string>()

    const addNode = (name: string, entityType: string, riskScore?: number, cospendId?: string, addressCount?: number) => {
      if (!nodeMap.has(name)) {
        // Color for Wallet node is determined later by average risk
        const color = name === "Wallet" ? DEFAULT_COLOR : getColorForEntityType(entityType.toLowerCase())
        nodeMap.set(name, currentNodes.length)
        currentNodes.push({ name, color, riskScore, entityType, cospendId, addressCount })
      }
      return nodeMap.get(name)!
    }

    const centralNodeName = "Wallet"
    // Add central node with a placeholder entityType, its color will be updated based on risk
    const centralNodeIndex = addNode(centralNodeName, "wallet", 0)

    const enrichedIncomingData = incomingData.map((d) => ({
      ...d,
      riskScore: riskScores[d.entityType.toLowerCase()] ?? 35,
    }))
    const enrichedOutgoingData = outgoingData.map((d) => ({
      ...d,
      riskScore: riskScores[d.entityType.toLowerCase()] ?? 35,
    }))

    // Calculate total incoming and outgoing values
    const totalIncomingValue = enrichedIncomingData.reduce((sum, item) => sum + item.value, 0)

    enrichedIncomingData.forEach((item) => {
      entityTypes.add(item.entityType)
      const sourceNodeIndex = addNode(`In: ${item.name}`, item.entityType, item.riskScore, item.cospendId, item.addressCount)
      currentLinks.push({
        source: sourceNodeIndex,
        target: centralNodeIndex,
        value: item.value,
        label: `${item.name} → Wallet: ${formatCurrency(item.value)}`,
        color: getColorFromRisk(item.riskScore),
        riskScore: item.riskScore,
        addressCount: item.addressCount,
      })
    })

    enrichedOutgoingData.forEach((item) => {
      entityTypes.add(item.entityType)
      const targetNodeIndex = addNode(`Out: ${item.name}`, item.entityType, item.riskScore, item.cospendId, item.addressCount)
      currentLinks.push({
        source: centralNodeIndex,
        target: targetNodeIndex,
        value: item.value,
        label: `Wallet → ${item.name}: ${formatCurrency(item.value)}`,
        color: getColorFromRisk(item.riskScore),
        riskScore: item.riskScore,
        addressCount: item.addressCount,
      })
    })

    const weightedRiskSum = enrichedIncomingData.reduce((sum, item) => sum + item.value * item.riskScore, 0)
    const averageRisk = totalIncomingValue > 0 ? weightedRiskSum / totalIncomingValue : 0

    if (currentNodes[centralNodeIndex]) {
      currentNodes[centralNodeIndex].color = getColorFromRisk(averageRisk)
      currentNodes[centralNodeIndex].riskScore = averageRisk
      // Ensure the entityType for the central node is consistent for the legend if needed
      currentNodes[centralNodeIndex].entityType = "Wallet"
    }
    // Add "Wallet" to uniqueEntityTypes if it's not already there from data
    if (!entityTypes.has("Wallet") && currentNodes.some((node) => node.entityType === "Wallet")) {
      entityTypes.add("Wallet")
    }

    return { nodes: currentNodes, links: currentLinks, uniqueEntityTypes: Array.from(entityTypes) }
  }, [incomingData, outgoingData])

  const sankeyData = { nodes, links }

  const CustomTooltip: FC<any> = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      if (data.source && data.target) {
        // Link tooltip
        return (
          <div className="bg-gray-800 rounded-lg shadow-lg text-sm p-3">
            <p className="font-semibold text-white">{data.label}</p>
            {data.riskScore !== undefined && <p className="text-gray-300">Risk Score: {Math.round(data.riskScore)}</p>}
            {data.addressCount && data.addressCount > 1 && (
              <p className="text-gray-300">Grouped by cospend ID ({data.addressCount} addresses)</p>
            )}
          </div>
        )
      }
      if (data.name) {
        // Node tooltip
        return (
          <div className="bg-gray-800 rounded-lg shadow-lg text-sm p-3">
            <p className="font-semibold text-white">
              {data.name.replace(/In: |Out: /g, "")}: {formatCurrency(data.value)}
            </p>
            {data.riskScore !== undefined && <p className="text-gray-300">Risk Score: {Math.round(data.riskScore)}</p>}
            {data.addressCount && data.addressCount > 1 && (
              <p className="text-gray-300">Grouped by cospend ID ({data.addressCount} addresses)</p>
            )}
            {data.cospendId && data.addressCount && data.addressCount > 1 && (
              <p className="text-gray-400 text-xs">Cospend ID: {data.cospendId}</p>
            )}
          </div>
        )
      }
    }
    return null
  }

  return (
<>
      <h4 className={`text-xl font-semibold mb-6 ${
        theme === 'dark' ? 'text-white' : 'text-gray-900'
      }`}>{title || "Funds Flow Analysis"}</h4>
      <p className={`text-sm mb-4 ${
        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
      }`}>
        Transactions are grouped by cospend ID to show related addresses as single entities, reducing visual complexity while showing larger transaction volumes.
      </p>
      <div className={`p-6 ${
        theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-50'
      }`}>
        {sankeyData.links.length > 0 ? (
          <>
            <div
              style={{
                height:
                  Math.max(
                    400,
                    (() => {
                      // Count incoming nodes for base height calculation
                      const incomingNodes = nodes.filter((n) => n.name.startsWith("In:")).length
                      return incomingNodes * 50 // Base height on number of incoming nodes
                    })(),
                  ) + "px",
                width: "100%",
              }}
            >
              {" "}
              <ResponsiveContainer width="100%" height="100%">
                <Sankey
                  data={sankeyData}
                  nodePadding={10}
                  nodeWidth={20}
                  margin={{ top: 20, right: 150, bottom: 20, left: 150 }}
                  node={CustomSankeyNode}
                  link={CustomSankeyLink}
                  nameKey="name"
                  dataKey="value"
                  iterations={64}
                  style={{ background: 'transparent' }}
                >
                  <Tooltip content={<CustomTooltip />} />
                </Sankey>
              </ResponsiveContainer>
            </div>
            <div className={`mt-4 pt-4 
            `}>
              <h3 className={`text-sm font-semibold mb-2 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>Legend</h3>
              <div className="flex flex-wrap gap-x-4 gap-y-2">
                {uniqueEntityTypes.map((type) => (
                  <div key={type} className="flex items-center gap-2 text-xs">
                    <span className="text-base">{getEmojiForEntityType(type.toLowerCase())}</span>
                    <div
                      className="w-3 h-3 rounded-sm"
                      style={{
                        backgroundColor:
                          type === "Wallet"
                            ? getColorFromRisk(nodes.find((n) => n.name === "Wallet")?.riskScore)
                            : getColorForEntityType(type.toLowerCase()),
                      }}
                    />
                    <span className={`capitalize ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                    }`}>{type}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-64">
            <p className={`${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>No transaction data available for flow analysis.</p>
          </div>
        )}
      </div>
      </>
  )
} 