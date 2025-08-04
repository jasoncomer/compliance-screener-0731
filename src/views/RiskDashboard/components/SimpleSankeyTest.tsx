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
  address: string
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



const DEFAULT_COLOR = "hsl(209, 50.80%, 52.90%)" // Blue default

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

  // Process real transaction data
  const { nodes, links} = useMemo(() => {
    // Debug: Log attribution data to see if cospend IDs are available
    console.log('SimpleSankeyTest - Attribution data:', {
      attributionsCount: Object.keys(attributions).length,
      sampleAttributions: Object.entries(attributions).slice(0, 3).map(([addr, attr]) => ({
        address: addr,
        cospend_id: attr.cospend_id,
        entity: attr.entity,
        bo: attr.bo,
        custodian: attr.custodian
      }))
    });
    const nodeMap = new Map<string, number>()
    const addressMap = new Map<string, { displayName: string; fullAddress: string; entityType: string }>()
    const currentNodes: { id: string; name: string; color: string; entityType: string; fullAddress?: string }[] = []
    const currentLinks: { source: number; target: number; value: number; label: string; color: string }[] = []
    const entityTypes = new Set<string>()

    const addNode = (name: string, entityType: string, fullAddress?: string) => {
      if (!nodeMap.has(name)) {
        let color
        if (name === "Wallet") {
          color = "hsl(210, 80%, 60%)" // Bright blue for central wallet
        } else if (name.startsWith("In:")) {
          color = "hsl(120, 80%, 60%)" // Green for incoming nodes
        } else if (name.startsWith("Out:")) {
          color = "hsl(0, 80%, 60%)" // Red for outgoing nodes
        } else {
          color = `hsl(${Math.random() * 360}, 80%, 60%)` // Random vibrant colors for other nodes
        }
        const index = currentNodes.length
        nodeMap.set(name, index)
        currentNodes.push({ id: name, name, color, entityType, fullAddress })
      }
      return nodeMap.get(name)!
    }

    const centralNodeName = "Address"
    const centralNodeIndex = addNode(centralNodeName, "address")

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
      // Calculate amount involving the current address for transaction a
      const aAddressInputs = a.inputs.filter(input => input.addr === address).reduce((sum, input) => sum + input.amt, 0)
      const aAddressOutputs = a.outputs.filter(output => output.addr === address).reduce((sum, output) => sum + output.amt, 0)
      const aAddressAmount = aAddressInputs + aAddressOutputs
      
      // Calculate amount involving the current address for transaction b
      const bAddressInputs = b.inputs.filter(input => input.addr === address).reduce((sum, input) => sum + input.amt, 0)
      const bAddressOutputs = b.outputs.filter(output => output.addr === address).reduce((sum, output) => sum + output.amt, 0)
      const bAddressAmount = bAddressInputs + bAddressOutputs
      
      return bAddressAmount - aAddressAmount // Sort descending (highest first)
    }).slice(0, maxTransactions) // Limit to top N biggest address transactions
    
    console.log('SimpleSankeyTest - Processing transactions:', {
      address,
      transactionCount: sortedTransactions.length,
      sampleTransaction: sortedTransactions[0],
      attributionsCount: Object.keys(attributions).length,
      itemsMapCount: Object.keys(itemsMap).length,
      topTransactionAmount: sortedTransactions[0] ? 
        (sortedTransactions[0].inputs.reduce((sum, input) => sum + input.amt, 0) + 
         sortedTransactions[0].outputs.reduce((sum, output) => sum + output.amt, 0)) / 100000000 : 0
    })
    
    if (sortedTransactions.length === 0) {
      return { nodes: currentNodes, links: currentLinks, uniqueEntityTypes: Array.from(entityTypes), cospendData: new Map() }
    }

    // Aggregate incoming and outgoing flows by individual addresses
    const incomingFlows = new Map<string, number>()
    const outgoingFlows = new Map<string, number>()

    sortedTransactions.forEach((tx: BtcTransaction) => {
      console.log('Processing transaction:', {
        txid: tx.txid,
        inputs: tx.inputs.length,
        outputs: tx.outputs.length,
        address
      })
      
      // Check if this address is receiving (has outputs to this address)
      const outputsToAddress = tx.outputs.filter(output => output.addr === address)
      const inputsFromAddress = tx.inputs.filter(input => input.addr === address)
      
      console.log('Address involvement:', {
        outputsToAddress: outputsToAddress.length,
        inputsFromAddress: inputsFromAddress.length,
        totalReceived: outputsToAddress.reduce((sum, output) => sum + output.amt, 0),
        totalSent: inputsFromAddress.reduce((sum, input) => sum + input.amt, 0)
      })
      
      // Process incoming flows (when address receives)
      if (outputsToAddress.length > 0) {
        const totalReceived = outputsToAddress.reduce((sum, output) => sum + output.amt, 0)
        
        // Group by individual source addresses
        const sourceAddressFlows = new Map<string, number>()
        
        tx.inputs.forEach(input => {
          if (input.addr !== address) {
            sourceAddressFlows.set(input.addr, (sourceAddressFlows.get(input.addr) || 0) + input.amt)
          }
        })
        
        console.log('Incoming flow sources:', Array.from(sourceAddressFlows.entries()))
        
        // Distribute received amount proportionally to source addresses
        const totalSourceAmount = Array.from(sourceAddressFlows.values()).reduce((sum, amt) => sum + amt, 0)
        
        sourceAddressFlows.forEach((sourceAmount, sourceAddr) => {
          const proportion = sourceAmount / totalSourceAmount
          const receivedAmount = totalReceived * proportion
          
          // Get entity info for display
          const entityId = attributions[sourceAddr]?.entity || attributions[sourceAddr]?.bo || attributions[sourceAddr]?.custodian
          const entity = entityId ? Object.values(itemsMap).find(item => item.entity_id === entityId) : null
          const entityType = entity?.entity_type || "Unknown"
          const displayName = entity?.proper_name || sourceAddr.slice(0, 8) + "..."
          
          const key = `In: ${displayName}`
          incomingFlows.set(key, (incomingFlows.get(key) || 0) + receivedAmount)
          
          // Store full address for hover tooltip
          addressMap.set(key, { displayName, fullAddress: sourceAddr, entityType })
        })
      }
      
      // Process outgoing flows (when address sends)
      if (inputsFromAddress.length > 0) {
        const totalSent = inputsFromAddress.reduce((sum, input) => sum + input.amt, 0)
        
        // Group by individual destination addresses
        const destAddressFlows = new Map<string, number>()
        
        tx.outputs.forEach(output => {
          if (output.addr !== address) {
            destAddressFlows.set(output.addr, (destAddressFlows.get(output.addr) || 0) + output.amt)
          }
        })
        
        console.log('Outgoing flow destinations:', Array.from(destAddressFlows.entries()))
        
        // Distribute sent amount proportionally to destination addresses
        const totalDestAmount = Array.from(destAddressFlows.values()).reduce((sum, amt) => sum + amt, 0)
        
        destAddressFlows.forEach((destAmount, destAddr) => {
          const proportion = destAmount / totalDestAmount
          const sentAmount = totalSent * proportion
          
          // Get entity info for display
          const entityId = attributions[destAddr]?.entity || attributions[destAddr]?.bo || attributions[destAddr]?.custodian
          const entity = entityId ? Object.values(itemsMap).find(item => item.entity_id === entityId) : null
          const entityType = entity?.entity_type || "Unknown"
          const displayName = entity?.proper_name || destAddr.slice(0, 8) + "..."
          
          const key = `Out: ${displayName}`
          outgoingFlows.set(key, (outgoingFlows.get(key) || 0) + sentAmount)
          
          // Store full address for hover tooltip
          addressMap.set(key, { displayName, fullAddress: destAddr, entityType })
        })
      }
    })

    // Limit flows to top 20 biggest flows (10 incoming + 10 outgoing)
    const maxFlowsPerDirection = Math.floor(maxTransactions / 2) // 10 flows per direction
    
    // Sort and limit incoming flows
    const sortedIncomingFlows = Array.from(incomingFlows.entries())
      .sort(([, a], [, b]) => b - a) // Sort by value descending
      .slice(0, maxFlowsPerDirection)
    
    // Sort and limit outgoing flows
    const sortedOutgoingFlows = Array.from(outgoingFlows.entries())
      .sort(([, a], [, b]) => b - a) // Sort by value descending
      .slice(0, maxFlowsPerDirection)
    
    // Create nodes and links for incoming flows (limited)
    sortedIncomingFlows.forEach(([key, value]) => {
      const entityName = key.replace("In: ", "")
      
      // Get stored address data
      const addressData = addressMap.get(key)
      const fullAddress = addressData?.fullAddress
      const entityType = addressData?.entityType || "Wallet"
      
      entityTypes.add(entityType)
      
      const sourceNodeIndex = addNode(key, entityType, fullAddress)
      currentLinks.push({
        source: sourceNodeIndex,
        target: centralNodeIndex,
        value: value,
        label: `${entityName} → Address: ${formatCurrency(value)}`,
        color: `hsl(${Math.random() * 360}, 70%, 60%)`, // Random vibrant colors for links
      })
    })

    // Create nodes and links for outgoing flows (limited)
    sortedOutgoingFlows.forEach(([key, value]) => {
      const entityName = key.replace("Out: ", "")
      
      // Get stored address data
      const addressData = addressMap.get(key)
      const fullAddress = addressData?.fullAddress
      const entityType = addressData?.entityType || "Wallet"
      
      entityTypes.add(entityType)
      
      const targetNodeIndex = addNode(key, entityType, fullAddress)
      currentLinks.push({
        source: centralNodeIndex,
        target: targetNodeIndex,
        value: value,
        label: `Address → ${entityName}: ${formatCurrency(value)}`,
        color: `hsl(${Math.random() * 360}, 70%, 60%)`, // Random vibrant colors for links
      })
    })

    // Set color for the central address node
    const centralNode = currentNodes.find(node => node.name === centralNodeName)
    if (centralNode) {
      centralNode.color = "hsl(210, 80%, 60%)" // Bright blue for central address
      centralNode.entityType = "Address"
    }

    if (!entityTypes.has("Address") && currentNodes.some((node) => node.entityType === "Address")) {
      entityTypes.add("Address")
    }

    console.log('Final Sankey data:', {
      incomingFlows: Array.from(incomingFlows.entries()),
      outgoingFlows: Array.from(outgoingFlows.entries()),
      totalNodes: currentNodes.length,
      totalLinks: currentLinks.length,
      entityTypes: Array.from(entityTypes)
    })

    return { 
      nodes: currentNodes, 
      links: currentLinks, 
      uniqueEntityTypes: Array.from(entityTypes),
      incomingFlows,
      outgoingFlows
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

    // Prepare links using indices for source/target, filtering out any undefined
    const sankeyLinksInput = links
      .map(link => {
        const sourceIdx = link.source;
        const targetIdx = link.target;
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
          .style("filter", "drop-shadow(0 0 8px rgba(59, 130, 246, 0.6))")
        
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
        // Get source and target node information
        const sourceNode = nodes[d.source.index]
        const targetNode = nodes[d.target.index]
        
        if (sourceNode && targetNode) {
          const linkModalData: LinkModalData = {
            sourceName: sourceNode.name.replace(/In: |Out: /g, ""),
            targetName: targetNode.name.replace(/In: |Out: /g, ""),
            sourceAddress: sourceNode.fullAddress || "",
            targetAddress: targetNode.fullAddress || "",
            value: d.value,
            sourceEntityType: sourceNode.entityType || "Unknown",
            targetEntityType: targetNode.entityType || "Unknown",
            sourceAttribution: sourceNode.fullAddress ? attributions[sourceNode.fullAddress] : undefined,
            targetAttribution: targetNode.fullAddress ? attributions[targetNode.fullAddress] : undefined
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
        return d.name === "Wallet" ? Math.max(baseWidth, 30) : baseWidth
      })
      .attr("fill", (d: any) => d.color || DEFAULT_COLOR)
      .attr("opacity", 0.95)
      .attr("rx", 4)
      .attr("ry", 4)
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
        const fullAddress = d.fullAddress
        
        tooltip.html(`
          <div class="font-semibold">${displayName}</div>
          ${fullAddress && fullAddress !== displayName ? `<div class="text-gray-500 font-mono text-xs">Full: ${fullAddress}</div>` : ''}
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
            .filter(link => link.target === d.index)
            .reduce((sum, link) => sum + link.value, 0)
          const totalOutgoing = links
            .filter(link => link.source === d.index)
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
          const fullAddress = originalNode.fullAddress || ""
          
          // Get attribution data
          const attribution = attributions[fullAddress]
          
          // Get flow value from links
          const flowValue = direction === 'incoming' 
            ? links.filter(link => link.target === d.index).reduce((sum, link) => sum + link.value, 0)
            : links.filter(link => link.source === d.index).reduce((sum, link) => sum + link.value, 0)
          
          const modalData: WalletModalData = {
            entityName,
            address: fullAddress,
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
        if (d.name === "Wallet") return "Wallet"
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
      }`}>Address Flow Analysis (Real Transaction Data)</h4>
      <p className={`text-sm mb-4 ${
        theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
      }`}>
        Showing Bitcoin (BTC) flow amounts between {nodes.length - 1} addresses from {transactionData?.txs?.length || 0} transactions (sorted by highest BTC amount)
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
            <div style={{ width: "100%", overflow: "auto" }}>
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
                    }`}>Address:</span>
                    <div className={`mt-1 p-2 rounded font-mono text-sm ${
                      theme === 'dark' ? 'bg-gray-600' : 'bg-white'
                    } border ${
                      theme === 'dark' ? 'border-gray-500' : 'border-gray-200'
                    }`}>
                      {modalData.address}
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