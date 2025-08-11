"use client"

import { useEffect, useRef, useMemo, useState } from "react"
import * as d3 from "d3"
import { sankey, sankeyLinkHorizontal } from "d3-sankey"
import { useTheme } from "../../../context/ThemeContext"
import { useAddressTransactions } from "../../../hooks/useAddressTransactions"
import { useAttribution } from "../../../context/AttributionContext"
import { useAppSelector } from "../../../store/hooks"
import { RootState } from "../../../store/store"
import { BtcTransaction } from "../../../typings/BtcTransaction"

interface SimpleSankeyTestProps {
  address: string
  maxTransactions?: number
}

interface WalletModalData {
  entityName: string
  addresses: string[]
  entityType: string
  direction: 'incoming' | 'outgoing'
  totalValue: number
  attribution?: any
}

interface LinkModalData {
  sourceName: string
  targetName: string
  sourceAddress: string
  targetAddress: string
  value: number
  sourceEntityType: string
  targetEntityType: string
  sourceAttribution?: any
  targetAttribution?: any
}

interface CenterWalletModalData {
  address: string
  totalIncoming: number
  totalOutgoing: number
  netFlow: number
  attribution?: any
}

// New interfaces for entity grouping
interface EntityGroup {
  name: string
  entityType: string
  addresses: string[]
  totalAmount: number
  entityId?: string
  properName?: string
}

interface SankeyNode {
  id: string
  name: string
  type: 'entity' | 'address'
  entityType: string
  entityGroup?: string
  addresses?: string[]
  fullAddress?: string
  color: string
}

interface SankeyLink {
  source: string
  target: string
  value: number
  label: string
  color: string
  transactionIds: string[]
}

const DEFAULT_COLOR = "hsl(30, 100%, 50%)" // Orange default

// Color palette for different entity types and flow directions
const COLOR_PALETTE = {
  // Incoming flows (green tones)
  incoming: {
    exchange: "hsl(120, 70%, 50%)",      // Green for exchanges
    mining: "hsl(160, 70%, 45%)",        // Teal for mining
    defi: "hsl(140, 80%, 40%)",          // Dark green for DeFi
    gambling: "hsl(100, 80%, 45%)",      // Light green for gambling
    mixer: "hsl(180, 70%, 40%)",         // Cyan for mixers
    darknet: "hsl(200, 80%, 35%)",       // Blue-green for darknet
    default: "hsl(130, 70%, 50%)"        // Default green
  },
  // Outgoing flows (red/purple tones)
  outgoing: {
    exchange: "hsl(0, 70%, 55%)",        // Red for exchanges
    mining: "hsl(340, 70%, 50%)",        // Pink for mining
    defi: "hsl(280, 70%, 50%)",          // Purple for DeFi
    gambling: "hsl(320, 80%, 45%)",      // Magenta for gambling
    mixer: "hsl(260, 70%, 45%)",         // Indigo for mixers
    darknet: "hsl(240, 80%, 40%)",       // Blue for darknet
    default: "hsl(0, 70%, 50%)"          // Default red
  },
  // Amount-based intensity modifiers
  intensity: {
    high: 0.9,      // High amount - more saturated
    medium: 0.7,    // Medium amount - normal saturation
    low: 0.5        // Low amount - less saturated
  }
}

// Function to get color for links based on entity type, flow amount, and direction
const getLinkColor = (amount: number, direction: 'incoming' | 'outgoing', entityType: string = 'Unknown'): string => {
  const palette = direction === 'incoming' ? COLOR_PALETTE.incoming : COLOR_PALETTE.outgoing
  
  // Determine entity type for color selection
  const normalizedEntityType = entityType.toLowerCase()
  let baseColor: string
  
  if (normalizedEntityType.includes('exchange') || normalizedEntityType.includes('binance') || normalizedEntityType.includes('coinbase')) {
    baseColor = palette.exchange
  } else if (normalizedEntityType.includes('mining') || normalizedEntityType.includes('pool')) {
    baseColor = palette.mining
  } else if (normalizedEntityType.includes('defi') || normalizedEntityType.includes('uniswap') || normalizedEntityType.includes('compound')) {
    baseColor = palette.defi
  } else if (normalizedEntityType.includes('gambling') || normalizedEntityType.includes('casino') || normalizedEntityType.includes('bet')) {
    baseColor = palette.gambling
  } else if (normalizedEntityType.includes('mixer') || normalizedEntityType.includes('tornado') || normalizedEntityType.includes('privacy')) {
    baseColor = palette.mixer
  } else if (normalizedEntityType.includes('darknet') || normalizedEntityType.includes('market') || normalizedEntityType.includes('silk')) {
    baseColor = palette.darknet
  } else {
    baseColor = palette.default
  }
  
  // Adjust intensity based on amount
  let intensity: number
  if (amount > 1000000000) { // > 10 BTC
    intensity = COLOR_PALETTE.intensity.high
  } else if (amount > 100000000) { // > 1 BTC
    intensity = COLOR_PALETTE.intensity.medium
  } else {
    intensity = COLOR_PALETTE.intensity.low
  }
  
  // Convert HSL to RGB, adjust saturation, then back to HSL
  const hslMatch = baseColor.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/)
  if (hslMatch) {
    const [, h, s, l] = hslMatch
    const adjustedSaturation = Math.round(parseInt(s) * intensity)
    return `hsl(${h}, ${adjustedSaturation}%, ${l}%)`
  }
  
  return baseColor
}

const formatCurrency = (value: number) => {
  // Convert satoshis to BTC (1 BTC = 100,000,000 satoshis)
  const btcValue = value / 100000000
  
  // Always show in BTC with appropriate decimal places
  if (btcValue >= 1) {
    return `${btcValue.toFixed(3)} BTC`
  } else if (btcValue >= 0.01) {
    return `${btcValue.toFixed(5)} BTC`
  } else if (btcValue >= 0.001) {
    return `${btcValue.toFixed(6)} BTC`
  } else {
    return `${btcValue.toFixed(8)} BTC`
  }
}

// Helper function to get entity information for an address
const getEntityInfo = (address: string, attributions: any, itemsMap: any) => {
  const attribution = attributions[address]
  if (!attribution) {
    return {
      entityId: null,
      entityType: "Unknown",
      displayName: address.slice(0, 8) + "...",
      properName: null
    }
  }

  const entityId = attribution.entity || attribution.bo || attribution.custodian
  const entity = entityId ? Object.values(itemsMap).find((item: any) => (item as any).entity_id === entityId) : null
  
  return {
    entityId,
    entityType: (entity as any)?.entity_type || "Unknown",
    displayName: (entity as any)?.proper_name || address.slice(0, 8) + "...",
    properName: (entity as any)?.proper_name || null
  }
}

// Helper function to group addresses by entity
const groupAddressesByEntity = (addresses: { addr: string; amt: number }[], attributions: any, itemsMap: any): EntityGroup[] => {
  const entityMap = new Map<string, EntityGroup>()
  
  addresses.forEach(({ addr, amt }) => {
    const { entityId, entityType, displayName, properName } = getEntityInfo(addr, attributions, itemsMap)
    
    // Use entity name as key, fallback to display name if no entity
    const entityKey = properName || displayName
    
    if (entityMap.has(entityKey)) {
      // Add to existing group
      const group = entityMap.get(entityKey)!
      if (!group.addresses.includes(addr)) {
        group.addresses.push(addr)
      }
      group.totalAmount += amt
    } else {
      // Create new group
      entityMap.set(entityKey, {
        name: entityKey,
        entityType,
        addresses: [addr],
        totalAmount: amt,
        entityId,
        properName
      })
    }
  })
  
  return Array.from(entityMap.values())
}

export const SimpleSankeyTest = ({ 
  address, 
  maxTransactions = 20 
}: SimpleSankeyTestProps) => {
  const { theme } = useTheme()
  const svgRef = useRef<SVGSVGElement>(null)
  const [modalData, setModalData] = useState<WalletModalData | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [linkModalData, setLinkModalData] = useState<LinkModalData | null>(null)
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false)
  const [centerWalletModalData, setCenterWalletModalData] = useState<CenterWalletModalData | null>(null)
  const [isCenterWalletModalOpen, setIsCenterWalletModalOpen] = useState(false)

  // Fetch transaction data - get last 20 transactions
  const { data: transactionData, isLoading: isLoadingTransactions } = useAddressTransactions(address, 1, 20)
  const { attributions } = useAttribution()
  const { itemsMap } = useAppSelector((state: RootState) => state.sot)

  // Process real transaction data with entity grouping
  const { nodes, links } = useMemo(() => {
    console.log('SimpleSankeyTest - Processing with entity grouping:', {
      address,
      attributionsCount: Object.keys(attributions).length,
      itemsMapCount: Object.keys(itemsMap).length
    })

    const nodeMap = new Map<string, number>()
    const currentNodes: SankeyNode[] = []
    const currentLinks: SankeyLink[] = []
    const entityTypes = new Set<string>()

    const addNode = (node: SankeyNode): number => {
      if (!nodeMap.has(node.id)) {
        const index = currentNodes.length
        nodeMap.set(node.id, index)
        currentNodes.push(node)
      }
      return nodeMap.get(node.id)!
    }

    // Add central address node
    const centralNode: SankeyNode = {
      id: "Address",
      name: "Address",
      type: 'address',
      entityType: "Address",
      color: "hsl(210, 80%, 60%)" // Bright blue for central address
    }
    addNode(centralNode)

    // Process real transaction data - filter for transactions involving current address
    const transactions = transactionData?.txs || []
    
    // Filter transactions that involve the current address
    const addressTransactions = transactions.filter(tx => {
      const hasInputsFromAddress = tx.inputs.some(input => input.addr === address)
      const hasOutputsToAddress = tx.outputs.some(output => output.addr === address)
      return hasInputsFromAddress || hasOutputsToAddress
    })
    
    // Sort by the amount that involves the current address (highest first)
    const sortedTransactions = addressTransactions.sort((a, b) => {
      const aAddressInputs = a.inputs.filter(input => input.addr === address).reduce((sum, input) => sum + input.amt, 0)
      const aAddressOutputs = a.outputs.filter(output => output.addr === address).reduce((sum, output) => sum + output.amt, 0)
      const aAddressAmount = aAddressInputs + aAddressOutputs
      
      const bAddressInputs = b.inputs.filter(input => input.addr === address).reduce((sum, input) => sum + input.amt, 0)
      const bAddressOutputs = b.outputs.filter(output => output.addr === address).reduce((sum, output) => sum + output.amt, 0)
      const bAddressAmount = bAddressInputs + bAddressOutputs
      
      return bAddressAmount - aAddressAmount // Sort descending (highest first)
    }).slice(0, maxTransactions)
    
    if (sortedTransactions.length === 0) {
      return { nodes: currentNodes, links: currentLinks, uniqueEntityTypes: Array.from(entityTypes) }
    }

    // Aggregate flows by entity groups
    const incomingEntityFlows = new Map<string, { amount: number; transactionIds: string[] }>()
    const outgoingEntityFlows = new Map<string, { amount: number; transactionIds: string[] }>()

    sortedTransactions.forEach((tx: BtcTransaction) => {
      console.log('Processing transaction:', {
        txid: tx.txid,
        inputs: tx.inputs.length,
        outputs: tx.outputs.length
      })
      
      // Check if this address is receiving (has outputs to this address)
      const outputsToAddress = tx.outputs.filter(output => output.addr === address)
      const inputsFromAddress = tx.inputs.filter(input => input.addr === address)
      
      // Process incoming flows (when address receives)
      if (outputsToAddress.length > 0) {
        const totalReceived = outputsToAddress.reduce((sum, output) => sum + output.amt, 0)
        
        // Get source addresses (excluding the current address)
        const sourceAddresses = tx.inputs.filter(input => input.addr !== address)
        
        // Group source addresses by entity
        const sourceEntityGroups = groupAddressesByEntity(sourceAddresses, attributions, itemsMap)
        
        // Distribute received amount proportionally to entity groups
        const totalSourceAmount = sourceEntityGroups.reduce((sum, group) => sum + group.totalAmount, 0)
        
        sourceEntityGroups.forEach(entityGroup => {
          const proportion = entityGroup.totalAmount / totalSourceAmount
          const receivedAmount = totalReceived * proportion
          
          const entityKey = `In: ${entityGroup.name}`
          const existing = incomingEntityFlows.get(entityKey)
          
          if (existing) {
            existing.amount += receivedAmount
            existing.transactionIds.push(tx.txid)
          } else {
            incomingEntityFlows.set(entityKey, {
              amount: receivedAmount,
              transactionIds: [tx.txid]
            })
          }
        })
      }
      
      // Process outgoing flows (when address sends)
      if (inputsFromAddress.length > 0) {
        const totalSent = inputsFromAddress.reduce((sum, input) => sum + input.amt, 0)
        
        // Get destination addresses (excluding the current address)
        const destAddresses = tx.outputs.filter(output => output.addr !== address)
        
        // Group destination addresses by entity
        const destEntityGroups = groupAddressesByEntity(destAddresses, attributions, itemsMap)
        
        // Distribute sent amount proportionally to entity groups
        const totalDestAmount = destEntityGroups.reduce((sum, group) => sum + group.totalAmount, 0)
        
        destEntityGroups.forEach(entityGroup => {
          const proportion = entityGroup.totalAmount / totalDestAmount
          const sentAmount = totalSent * proportion
          
          const entityKey = `Out: ${entityGroup.name}`
          const existing = outgoingEntityFlows.get(entityKey)
          
          if (existing) {
            existing.amount += sentAmount
            existing.transactionIds.push(tx.txid)
          } else {
            outgoingEntityFlows.set(entityKey, {
              amount: sentAmount,
              transactionIds: [tx.txid]
            })
          }
        })
      }
    })

    // Limit flows to top entities per direction
    const maxFlowsPerDirection = Math.floor(maxTransactions / 2)
    
    // Sort and limit incoming entity flows
    const sortedIncomingFlows = Array.from(incomingEntityFlows.entries())
      .sort(([, a], [, b]) => b.amount - a.amount)
      .slice(0, maxFlowsPerDirection)
    
    // Sort and limit outgoing entity flows
    const sortedOutgoingFlows = Array.from(outgoingEntityFlows.entries())
      .sort(([, a], [, b]) => b.amount - a.amount)
      .slice(0, maxFlowsPerDirection)
    
    // Create nodes and links for incoming entity flows
    sortedIncomingFlows.forEach(([entityKey, flowData]) => {
      const entityName = entityKey.replace("In: ", "")
      
      // Get entity info from the first address in the group
      const sourceAddresses = sortedTransactions
        .flatMap(tx => tx.inputs.filter(input => input.addr !== address))
        .filter(input => {
          const { properName } = getEntityInfo(input.addr, attributions, itemsMap)
          return properName === entityName || (!properName && input.addr.slice(0, 8) + "..." === entityName)
        })
      
      const firstAddress = sourceAddresses[0]
      const { entityType } = firstAddress ? getEntityInfo(firstAddress.addr, attributions, itemsMap) : { entityType: "Unknown" }
      
      entityTypes.add(entityType)
      
      const sourceNode: SankeyNode = {
        id: entityKey,
        name: entityName,
        type: 'entity',
        entityType,
        entityGroup: entityName,
        addresses: sourceAddresses.map(input => input.addr),
        color: "hsl(210, 80%, 60%)" // Blue for incoming nodes
      }
      
      addNode(sourceNode)
      
      currentLinks.push({
        source: entityKey,
        target: "Address",
        value: flowData.amount,
        label: `${entityName} → Address: ${formatCurrency(flowData.amount)}`,
        color: getLinkColor(flowData.amount, 'incoming', entityType),
        transactionIds: flowData.transactionIds
      })
    })

    // Create nodes and links for outgoing entity flows
    sortedOutgoingFlows.forEach(([entityKey, flowData]) => {
      const entityName = entityKey.replace("Out: ", "")
      
      // Get entity info from the first address in the group
      const destAddresses = sortedTransactions
        .flatMap(tx => tx.outputs.filter(output => output.addr !== address))
        .filter(output => {
          const { properName } = getEntityInfo(output.addr, attributions, itemsMap)
          return properName === entityName || (!properName && output.addr.slice(0, 8) + "..." === entityName)
        })
      
      const firstAddress = destAddresses[0]
      const { entityType } = firstAddress ? getEntityInfo(firstAddress.addr, attributions, itemsMap) : { entityType: "Unknown" }
      
      entityTypes.add(entityType)
      
      const targetNode: SankeyNode = {
        id: entityKey,
        name: entityName,
        type: 'entity',
        entityType,
        entityGroup: entityName,
        addresses: destAddresses.map(output => output.addr),
        color: "hsl(210, 80%, 60%)" // Blue for outgoing nodes
      }
      
      addNode(targetNode)
      
      currentLinks.push({
        source: "Address",
        target: entityKey,
        value: flowData.amount,
        label: `Address → ${entityName}: ${formatCurrency(flowData.amount)}`,
        color: getLinkColor(flowData.amount, 'outgoing', entityType),
        transactionIds: flowData.transactionIds
      })
    })

    if (!entityTypes.has("Address")) {
      entityTypes.add("Address")
    }

    console.log('Final Sankey data with entity grouping:', {
      incomingEntityFlows: Array.from(incomingEntityFlows.entries()),
      outgoingEntityFlows: Array.from(outgoingEntityFlows.entries()),
      totalNodes: currentNodes.length,
      totalLinks: currentLinks.length,
      entityTypes: Array.from(entityTypes)
    })

    return { 
      nodes: currentNodes, 
      links: currentLinks, 
      uniqueEntityTypes: Array.from(entityTypes)
    }
  }, [address, maxTransactions, transactionData, attributions, itemsMap])

  useEffect(() => {
    if (!svgRef.current || links.length === 0) return

    // Clear previous content
    d3.select(svgRef.current).selectAll("*").remove()

    const svg = d3.select(svgRef.current)
    const margin = { top: 20, right: 150, bottom: 20, left: 150 }
    const width = 800
    const height = 400
    const chartWidth = width - margin.left - margin.right
    const chartHeight = height - margin.top - margin.bottom

    // Create the Sankey generator
    const sankeyGenerator = sankey()
      .nodeWidth(20)
      .nodePadding(10)
      .extent([[0, 0], [chartWidth, chartHeight]])



    // Fix: Ensure D3 Sankey receives the correct node/link structure and types

    // D3 Sankey expects nodes to be objects (can be empty) and links to use node indices.
    // We'll map nodes to empty objects and links to use indices (not undefined).



    // Prepare minimal nodes for D3 Sankey (empty objects)
    const sankeyNodesInput = nodes.map(() => ({}));

    // Create a mapping from node IDs to indices
    const nodeIdToIndex = new Map<string, number>();
    nodes.forEach((node, index) => {
      nodeIdToIndex.set(node.id, index);
    });

    // Prepare links using indices for source/target, filtering out any undefined
    const sankeyLinksInput = links
      .map(link => {
        const sourceIdx = nodeIdToIndex.get(link.source);
        const targetIdx = nodeIdToIndex.get(link.target);
        if (sourceIdx === undefined || targetIdx === undefined) return null;
        return {
          source: sourceIdx,
          target: targetIdx,
          value: link.value,
          label: link.label,
          color: link.color
        };
      })
      .filter((l): l is { source: number; target: number; value: number; label: string; color: string } => l !== null);

    // Generate the Sankey layout
    const { nodes: sankeyNodes, links: sankeyLinks } = sankeyGenerator({
      nodes: sankeyNodesInput,
      links: sankeyLinksInput
    });

    // Create the link generator
    const linkGenerator = sankeyLinkHorizontal();

    // Add links
    svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`)
      .selectAll("path")
      .data(sankeyLinks)
      .enter()
      .append("path")
      .attr("d", linkGenerator as any)
      .attr("stroke", (d: any) => d.color || DEFAULT_COLOR)
      .attr("stroke-width", (d: any) => Math.max(2, d.width))
      .attr("fill", "none")
      .attr("opacity", 0.6)
      .style("cursor", "pointer")
      .style("transition", "all 0.2s ease")
      .on("mouseover", function(_, d: any) {
        // Highlight the hovered link
        d3.select(this)
          .attr("opacity", 1)
          .style("filter", "drop-shadow(0 0 8px rgba(0, 0, 0, 0.3))")
        
        // Dim other links
        svg.selectAll("path")
          .filter((_, i) => i !== d.index)
          .attr("opacity", 0.2)
        
        // Show tooltip
        const tooltip = d3.select("body").append("div")
          .attr("class", "tooltip")
          .style("position", "absolute")
          .style("background", theme === 'dark' ? "#1f2937" : "#ffffff")
          .style("border", "1px solid #d1d5db")
          .style("border-radius", "8px")
          .style("padding", "12px")
          .style("font-size", "14px")
          .style("pointer-events", "none")
          .style("z-index", "1000")
          .style("box-shadow", "0 4px 6px -1px rgba(0, 0, 0, 0.1)")
          .style("color", theme === 'dark' ? "#ffffff" : "#000000")

        tooltip.html(`
          <div class="font-semibold">${d.label}</div>
          <div class="text-sm text-gray-500 mt-1">Click for details</div>
        `)
      })
      .on("mousemove", function(event) {
        const tooltip = d3.select(".tooltip")
        tooltip
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 10) + "px")
      })
      .on("click", function(_, d: any) {
        // Get source and target node information using the D3 node indices
        const sourceNode = nodes[d.source.index]
        const targetNode = nodes[d.target.index]
        
        if (sourceNode && targetNode) {
          // Get proper entity information for source
          let sourceName = sourceNode.name.replace(/In: |Out: /g, "")
          let sourceEntityType = sourceNode.entityType || "Unknown"
          
          if (sourceNode.addresses?.[0]) {
            const sourceAddress = sourceNode.addresses[0]
            const sourceAttribution = attributions[sourceAddress]
            if (sourceAttribution) {
              const entityId = sourceAttribution.entity || sourceAttribution.bo || sourceAttribution.custodian
              const entity = entityId ? Object.values(itemsMap).find((item: any) => (item as any).entity_id === entityId) : null
              if (entity) {
                sourceName = (entity as any).proper_name || sourceName
                sourceEntityType = (entity as any).entity_type || sourceEntityType
              }
            }
          }
          
          // Get proper entity information for target
          let targetName = targetNode.name.replace(/In: |Out: /g, "")
          let targetEntityType = targetNode.entityType || "Unknown"
          
          if (targetNode.addresses?.[0]) {
            const targetAddress = targetNode.addresses[0]
            const targetAttribution = attributions[targetAddress]
            if (targetAttribution) {
              const entityId = targetAttribution.entity || targetAttribution.bo || targetAttribution.custodian
              const entity = entityId ? Object.values(itemsMap).find((item: any) => (item as any).entity_id === entityId) : null
              if (entity) {
                targetName = (entity as any).proper_name || targetName
                targetEntityType = (entity as any).entity_type || targetEntityType
              }
            }
          }
          
          const linkModalData: LinkModalData = {
            sourceName,
            targetName,
            sourceAddress: sourceNode.addresses?.[0] || "",
            targetAddress: targetNode.addresses?.[0] || "",
            value: d.value,
            sourceEntityType,
            targetEntityType,
            sourceAttribution: sourceNode.addresses?.[0] ? attributions[sourceNode.addresses[0]] : undefined,
            targetAttribution: targetNode.addresses?.[0] ? attributions[targetNode.addresses[0]] : undefined
          }
          
          setLinkModalData(linkModalData)
          setIsLinkModalOpen(true)
        }
      })
      .on("mouseout", function() {
        // Reset the hovered link
        d3.select(this)
          .attr("opacity", 0.6)
          .style("filter", "none")
        
        // Reset all other links
        svg.selectAll("path")
          .attr("opacity", 0.6)
        
        d3.select(".tooltip").remove()
      })

    // Add nodes
    const nodeGroup = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`)
      .selectAll("g")
      .data(sankeyNodes)
      .enter()
      .append("g")
      .attr("transform", (d: any) => `translate(${d.x0},${d.y0})`)

    // Add node rectangles
    nodeGroup.append("rect")
      .attr("height", (d: any) => d.y1 - d.y0)
      .attr("width", (d: any) => {
        const baseWidth = d.x1 - d.x0
        return d.name === "Address" ? Math.max(baseWidth, 30) : baseWidth
      })
      .attr("fill", (d: any) => d.color || DEFAULT_COLOR)
      .attr("opacity", .95)
      .attr("rx", 2)
      .attr("ry", 2)
      .style("cursor", (d: any) => d.name !== "Address" ? "pointer" : "default")

      .on("mouseover", function(_, d: any) {
        d3.select(this).attr("opacity", 1)
        
        // Show tooltip
        const tooltip = d3.select("body").append("div")
          .attr("class", "tooltip")
          .style("position", "absolute")
          .style("background", theme === 'dark' ? "#1f2937" : "#ffffff")
          .style("border", "1px solid #d1d5db")
          .style("border-radius", "8px")
          .style("padding", "12px")
          .style("font-size", "14px")
          .style("pointer-events", "none")
          .style("z-index", "1000")
          .style("box-shadow", "0 4px 6px -1px rgba(0, 0, 0, 0.1)")
                  .style("color", theme === 'dark' ? "#ffffff" : "#000000")

        const displayName = d.name.replace(/In: |Out: /g, "")
        const addresses = d.addresses || []
        
        tooltip.html(`
          <div class="font-semibold">${displayName}</div>
          ${addresses.length > 0 ? `<div class="text-gray-500 font-mono text-xs">${addresses.length} address${addresses.length > 1 ? 'es' : ''}</div>` : ''}
        `)
        })
      .on("mousemove", function(event) {
        const tooltip = d3.select(".tooltip")
        tooltip
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 10) + "px")
      })
      .on("mouseout", function() {
        d3.select(this).attr("opacity", 0.9)
        d3.select(".tooltip").remove()
      })
      .on("click", function(_, d: any) {
        // Get the original node data using the D3 node index
        const originalNode = nodes[d.index]
        
        if (originalNode && originalNode.name === "Address") {
          // Handle center wallet node - calculate totals from links
          const totalIncoming = links
            .filter(link => link.target === originalNode.id)
            .reduce((sum, link) => sum + link.value, 0)
          const totalOutgoing = links
            .filter(link => link.source === originalNode.id)
            .reduce((sum, link) => sum + link.value, 0)
          const netFlow = totalIncoming - totalOutgoing
          
          const centerWalletModalData: CenterWalletModalData = {
            address: address,
            totalIncoming,
            totalOutgoing,
            netFlow,
            attribution: attributions[address]
          }
          
          setCenterWalletModalData(centerWalletModalData)
          setIsCenterWalletModalOpen(true)
        } else if (originalNode) {
          // Handle other nodes - calculate flow value from links
          const entityName = originalNode.name.replace(/In: |Out: /g, "")
          const direction = originalNode.name.startsWith("In:") ? 'incoming' : 'outgoing'
          const firstAddress = originalNode.addresses?.[0] || ""
          
          // Get attribution data
          const attribution = firstAddress ? attributions[firstAddress] : undefined
          
          // Get flow value from links
          const flowValue = direction === 'incoming' 
            ? links.filter(link => link.target === originalNode.id).reduce((sum, link) => sum + link.value, 0)
            : links.filter(link => link.source === originalNode.id).reduce((sum, link) => sum + link.value, 0)
          
          const modalData: WalletModalData = {
            entityName,
            addresses: originalNode.addresses || [],
            entityType: originalNode.entityType || "Unknown",
            direction,
            totalValue: flowValue,
            attribution
          }
          
          setModalData(modalData)
          setIsModalOpen(true)
        }
      })


    // Add node labels (entity names only)
    nodeGroup.append("text")
      .attr("x", (d: any) => d.x0 < chartWidth / 2 ? -25 : 25)
      .attr("y", (d: any) => (d.y1 - d.y0) / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", (d: any) => d.x0 < chartWidth / 2 ? "end" : "start")
      .attr("fill", theme === 'dark' ? "#ffffff" : "#000000")
      .attr("font-size", "12px")
      .text((d: any) => {
        if (!d.name) return ""
        if (d.name === "Address") return "Address"
        if (d.name.startsWith("In:") || d.name.startsWith("Out:")) {
          // Extract just the entity name part
          const parts = d.name.split(": ")
          return parts.length > 1 ? parts[1] : d.name
        }
        return d.name
      })



  }, [nodes, links, theme])

  return (
    <>
      <h4 className={`text-xl font-semibold mb-6 ${
        theme === 'dark' ? 'text-white' : 'text-gray-900'
      }`}>Address Flow Analysis (Entity Grouped)</h4>
      <p className={`text-sm mb-4 ${
        theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
      }`}>
        Showing Bitcoin (BTC) flow amounts between {nodes.length - 1} entities from {transactionData?.txs?.length || 0} transactions. Addresses are grouped by entity for better readability.
      </p>
      <div className={`p-6 ${
        theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-50'
      }`}>
        {isLoadingTransactions ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className={`ml-3 ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
            }`}>Loading transaction data...</span>
          </div>
        ) : links.length > 0 ? (
          <>
            <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
              <svg
                ref={svgRef}
                width={800}
                height={400}
                style={{ background: 'transparent' }}
              />
            </div>

          </>
        ) : (
          <div className="flex items-center justify-center h-64">
            <p className={`${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>No transaction data available for flow analysis. Try searching for a different address.</p>
          </div>
        )}
      </div>
      
      {/* Address Details Modal */}
      {isModalOpen && modalData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`max-w-2xl w-full mx-4 p-6 rounded-lg ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          } shadow-xl`}>
            <div className="flex justify-between items-start mb-4">
              <h3 className={`text-xl font-semibold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Address Details
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className={`p-2 rounded-lg hover:bg-opacity-80 ${
                  theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Basic Information */}
              <div className={`p-4 rounded-lg ${
                theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
              }`}>
                <h4 className={`font-semibold mb-2 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>Basic Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className={`font-medium ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                    }`}>Entity Name:</span>
                    <span className={`ml-2 ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>{modalData.entityName}</span>
                  </div>
                  <div>
                    <span className={`font-medium ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                    }`}>Entity Type:</span>
                    <span className={`ml-2 ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>{modalData.entityType}</span>
                  </div>
                  <div>
                    <span className={`font-medium ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                    }`}>Direction:</span>
                    <span className={`ml-2 capitalize ${
                      modalData.direction === 'incoming' ? 'text-green-500' : 'text-red-500'
                    }`}>{modalData.direction}</span>
                  </div>
                  <div>
                    <span className={`font-medium ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                    }`}>Total Value:</span>
                    <span className={`ml-2 ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>{formatCurrency(modalData.totalValue)}</span>
                  </div>
                </div>
              </div>
              
              {/* Address Information */}
              <div className={`p-4 rounded-lg ${
                theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
              }`}>
                <h4 className={`font-semibold mb-2 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>Address Information</h4>
                <div className="space-y-2">
                  <div>
                    <span className={`font-medium ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                    }`}>Addresses ({modalData.addresses.length}):</span>
                    <div className={`mt-1 max-h-32 overflow-y-auto space-y-1 ${
                      theme === 'dark' ? 'bg-gray-600' : 'bg-white'
                    } border ${
                      theme === 'dark' ? 'border-gray-500' : 'border-gray-200'
                    } rounded p-2`}>
                      {modalData.addresses.map((addr, index) => (
                        <div key={index} className="font-mono text-xs">
                          {addr}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Attribution Information */}
              {modalData.attribution && (
                <div className={`p-4 rounded-lg ${
                  theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
                }`}>
                  <h4 className={`font-semibold mb-2 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>Attribution Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {modalData.attribution.entity && (
                      <div>
                        <span className={`font-medium ${
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                        }`}>Entity:</span>
                        <span className={`ml-2 ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>{modalData.attribution.entity}</span>
                      </div>
                    )}
                    {modalData.attribution.bo && (
                      <div>
                        <span className={`font-medium ${
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                        }`}>Beneficial Owner:</span>
                        <span className={`ml-2 ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>{modalData.attribution.bo}</span>
                      </div>
                    )}
                    {modalData.attribution.custodian && (
                      <div>
                        <span className={`font-medium ${
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                        }`}>Custodian:</span>
                        <span className={`ml-2 ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>{modalData.attribution.custodian}</span>
                      </div>
                    )}
                    {modalData.attribution.cospend_id && (
                      <div>
                        <span className={`font-medium ${
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                        }`}>Cospend ID:</span>
                        <span className={`ml-2 font-mono text-sm ${
                          theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                        }`}>{modalData.attribution.cospend_id}</span>
                      </div>
                    )}
                    {modalData.attribution.script_type && (
                      <div>
                        <span className={`font-medium ${
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                        }`}>Script Type:</span>
                        <span className={`ml-2 ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>{modalData.attribution.script_type}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setIsModalOpen(false)}
                className={`px-4 py-2 rounded-lg ${
                  theme === 'dark' 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Link Details Modal */}
      {isLinkModalOpen && linkModalData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`max-w-3xl w-full mx-4 p-6 rounded-lg ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          } shadow-xl`}>
            <div className="flex justify-between items-start mb-4">
              <h3 className={`text-xl font-semibold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Transaction Flow Details
              </h3>
              <button
                onClick={() => setIsLinkModalOpen(false)}
                className={`p-2 rounded-lg hover:bg-opacity-80 ${
                  theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Flow Information */}
              <div className={`p-4 rounded-lg ${
                theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
              }`}>
                <h4 className={`font-semibold mb-2 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>Flow Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className={`font-medium ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                    }`}>Amount:</span>
                    <span className={`ml-2 ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>{formatCurrency(linkModalData.value)}</span>
                  </div>
                  <div>
                    <span className={`font-medium ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                    }`}>Direction:</span>
                    <span className={`ml-2 ${
                      theme === 'dark' ? 'text-green-400' : 'text-green-600'
                    }`}>From {linkModalData.sourceName} → To {linkModalData.targetName}</span>
                  </div>
                </div>
              </div>

              {/* Source Entity */}
              <div className={`p-4 rounded-lg ${
                theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
              }`}>
                <h4 className={`font-semibold mb-2 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>Source Entity</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className={`font-medium ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                    }`}>Name:</span>
                    <span className={`ml-2 ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>{linkModalData.sourceName}</span>
                  </div>
                  <div>
                    <span className={`font-medium ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                    }`}>Type:</span>
                    <span className={`ml-2 ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>{linkModalData.sourceEntityType}</span>
                  </div>
                </div>
                {linkModalData.sourceAddress && (
                  <div className="mt-2">
                    <span className={`font-medium ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                    }`}>Address:</span>
                    <div className={`mt-1 p-2 rounded font-mono text-sm ${
                      theme === 'dark' ? 'bg-gray-600' : 'bg-white'
                    } border ${
                      theme === 'dark' ? 'border-gray-500' : 'border-gray-200'
                    }`}>
                      {linkModalData.sourceAddress}
                    </div>
                  </div>
                )}
              </div>

              {/* Target Entity */}
              <div className={`p-4 rounded-lg ${
                theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
              }`}>
                <h4 className={`font-semibold mb-2 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>Target Entity</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className={`font-medium ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                    }`}>Name:</span>
                    <span className={`ml-2 ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>{linkModalData.targetName}</span>
                  </div>
                  <div>
                    <span className={`font-medium ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                    }`}>Type:</span>
                    <span className={`ml-2 ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>{linkModalData.targetEntityType}</span>
                  </div>
                </div>
                {linkModalData.targetAddress && (
                  <div className="mt-2">
                    <span className={`font-medium ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                    }`}>Address:</span>
                    <div className={`mt-1 p-2 rounded font-mono text-sm ${
                      theme === 'dark' ? 'bg-gray-600' : 'bg-white'
                    } border ${
                      theme === 'dark' ? 'border-gray-500' : 'border-gray-200'
                    }`}>
                      {linkModalData.targetAddress}
                    </div>
                  </div>
                )}
              </div>

              {/* Attribution Information */}
              {(linkModalData.sourceAttribution || linkModalData.targetAttribution) && (
                <div className={`p-4 rounded-lg ${
                  theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
                }`}>
                  <h4 className={`font-semibold mb-2 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>Attribution Information</h4>
                  
                  {linkModalData.sourceAttribution && (
                    <div className="mb-4">
                      <h5 className={`font-medium mb-2 ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                      }`}>Source Attribution:</h5>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        {linkModalData.sourceAttribution.entity && (
                          <div>
                            <span className={`font-medium ${
                              theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                            }`}>Entity:</span>
                            <span className={`ml-2 ${
                              theme === 'dark' ? 'text-white' : 'text-gray-900'
                            }`}>{linkModalData.sourceAttribution.entity}</span>
                          </div>
                        )}
                        {linkModalData.sourceAttribution.cospend_id && (
                          <div>
                            <span className={`font-medium ${
                              theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                            }`}>Cospend ID:</span>
                            <span className={`ml-2 font-mono text-sm ${
                              theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                            }`}>{linkModalData.sourceAttribution.cospend_id}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {linkModalData.targetAttribution && (
                    <div>
                      <h5 className={`font-medium mb-2 ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                      }`}>Target Attribution:</h5>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        {linkModalData.targetAttribution.entity && (
                          <div>
                            <span className={`font-medium ${
                              theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                            }`}>Entity:</span>
                            <span className={`ml-2 ${
                              theme === 'dark' ? 'text-white' : 'text-gray-900'
                            }`}>{linkModalData.targetAttribution.entity}</span>
                          </div>
                        )}
                        {linkModalData.targetAttribution.cospend_id && (
                          <div>
                            <span className={`font-medium ${
                              theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                            }`}>Cospend ID:</span>
                            <span className={`ml-2 font-mono text-sm ${
                              theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                            }`}>{linkModalData.targetAttribution.cospend_id}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setIsLinkModalOpen(false)}
                className={`px-4 py-2 rounded-lg ${
                  theme === 'dark' 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Center Address Modal */}
      {isCenterWalletModalOpen && centerWalletModalData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`max-w-2xl w-full mx-4 p-6 rounded-lg ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          } shadow-xl`}>
            <div className="flex justify-between items-start mb-4">
              <h3 className={`text-xl font-semibold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Center Address Details
              </h3>
              <button
                onClick={() => setIsCenterWalletModalOpen(false)}
                className={`p-2 rounded-lg hover:bg-opacity-80 ${
                  theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Flow Summary */}
              <div className={`p-4 rounded-lg ${
                theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
              }`}>
                <h4 className={`font-semibold mb-2 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>Flow Summary</h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className={`font-medium ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                    }`}>Total Incoming:</span>
                    <span className={`ml-2 ${
                      theme === 'dark' ? 'text-green-400' : 'text-green-600'
                    }`}>{formatCurrency(centerWalletModalData.totalIncoming)}</span>
                  </div>
                  <div>
                    <span className={`font-medium ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                    }`}>Total Outgoing:</span>
                    <span className={`ml-2 ${
                      theme === 'dark' ? 'text-red-400' : 'text-red-600'
                    }`}>{formatCurrency(centerWalletModalData.totalOutgoing)}</span>
                  </div>
                  <div>
                    <span className={`font-medium ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                    }`}>Net Flow:</span>
                    <span className={`ml-2 ${
                      centerWalletModalData.netFlow >= 0 
                        ? (theme === 'dark' ? 'text-green-400' : 'text-green-600')
                        : (theme === 'dark' ? 'text-red-400' : 'text-red-600')
                    }`}>{formatCurrency(centerWalletModalData.netFlow)}</span>
                  </div>
                </div>
              </div>
              
              {/* Address Information */}
              <div className={`p-4 rounded-lg ${
                theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
              }`}>
                <h4 className={`font-semibold mb-2 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>Address Information</h4>
                <div className="space-y-2">
                  <div>
                    <span className={`font-medium ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                    }`}>Address:</span>
                    <div className={`mt-1 p-2 rounded font-mono text-sm ${
                      theme === 'dark' ? 'bg-gray-600' : 'bg-white'
                    } border ${
                      theme === 'dark' ? 'border-gray-500' : 'border-gray-200'
                    }`}>
                      {centerWalletModalData.address}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Attribution Information */}
              {centerWalletModalData.attribution && (
                <div className={`p-4 rounded-lg ${
                  theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
                }`}>
                  <h4 className={`font-semibold mb-2 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>Attribution Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {centerWalletModalData.attribution.entity && (
                      <div>
                        <span className={`font-medium ${
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                        }`}>Entity:</span>
                        <span className={`ml-2 ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>{centerWalletModalData.attribution.entity}</span>
                      </div>
                    )}
                    {centerWalletModalData.attribution.bo && (
                      <div>
                        <span className={`font-medium ${
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                        }`}>Beneficial Owner:</span>
                        <span className={`ml-2 ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>{centerWalletModalData.attribution.bo}</span>
                      </div>
                    )}
                    {centerWalletModalData.attribution.custodian && (
                      <div>
                        <span className={`font-medium ${
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                        }`}>Custodian:</span>
                        <span className={`ml-2 ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>{centerWalletModalData.attribution.custodian}</span>
                      </div>
                    )}
                    {centerWalletModalData.attribution.cospend_id && (
                      <div>
                        <span className={`font-medium ${
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                        }`}>Cospend ID:</span>
                        <span className={`ml-2 font-mono text-sm ${
                          theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                        }`}>{centerWalletModalData.attribution.cospend_id}</span>
                      </div>
                    )}
                    {centerWalletModalData.attribution.script_type && (
                      <div>
                        <span className={`font-medium ${
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                        }`}>Script Type:</span>
                        <span className={`ml-2 ${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>{centerWalletModalData.attribution.script_type}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setIsCenterWalletModalOpen(false)}
                className={`px-4 py-2 rounded-lg ${
                  theme === 'dark' 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
} 