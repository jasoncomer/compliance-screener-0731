"use client"

import { useEffect, useRef, useMemo } from "react"
import * as d3 from "d3"
import { sankey, sankeyLinkHorizontal } from "d3-sankey"
import { getColorForEntityType, getEmojiForEntityType } from "../../../lib/entity-types"
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

const DEFAULT_COLOR = "hsl(210, 70%, 60%)" // Blue default

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

  // Fetch transaction data - get last 40 transactions
  const { data: transactionData, isLoading: isLoadingTransactions } = useAddressTransactions(address, 1, 40)
  const { attributions } = useAttribution()
  const { itemsMap } = useAppSelector((state: RootState) => state.sot)

  // Process real transaction data
  const { nodes, links, uniqueEntityTypes } = useMemo(() => {
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

    const centralNodeName = "Wallet"
    const centralNodeIndex = addNode(centralNodeName, "wallet")

    // Process real transaction data - sort by BTC amount (highest first)
    const transactions = transactionData?.txs || []
    
    // Sort transactions by total BTC amount involved (highest first)
    const sortedTransactions = transactions.sort((a, b) => {
      const aTotal = a.inputs.reduce((sum, input) => sum + input.amt, 0) + 
                    a.outputs.reduce((sum, output) => sum + output.amt, 0)
      const bTotal = b.inputs.reduce((sum, input) => sum + input.amt, 0) + 
                    b.outputs.reduce((sum, output) => sum + output.amt, 0)
      return bTotal - aTotal // Sort descending (highest first)
    })
    
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
      return { nodes: currentNodes, links: currentLinks, uniqueEntityTypes: Array.from(entityTypes) }
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

    // Create nodes and links for incoming flows
    incomingFlows.forEach((value, key) => {
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
        label: `${entityName} → Wallet: ${formatCurrency(value)}`,
        color: `hsl(${Math.random() * 360}, 70%, 60%)`, // Random vibrant colors for links
      })
    })

    // Create nodes and links for outgoing flows
    outgoingFlows.forEach((value, key) => {
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
        label: `Wallet → ${entityName}: ${formatCurrency(value)}`,
        color: `hsl(${Math.random() * 360}, 70%, 60%)`, // Random vibrant colors for links
      })
    })

    // Set color for the central wallet node
    const centralNode = currentNodes.find(node => node.name === centralNodeName)
    if (centralNode) {
      centralNode.color = "hsl(210, 80%, 60%)" // Bright blue for central wallet
      centralNode.entityType = "Wallet"
    }

    if (!entityTypes.has("Wallet") && currentNodes.some((node) => node.entityType === "Wallet")) {
      entityTypes.add("Wallet")
    }

    console.log('Final Sankey data:', {
      incomingFlows: Array.from(incomingFlows.entries()),
      outgoingFlows: Array.from(outgoingFlows.entries()),
      totalNodes: currentNodes.length,
      totalLinks: currentLinks.length,
      entityTypes: Array.from(entityTypes)
    })

    return { nodes: currentNodes, links: currentLinks, uniqueEntityTypes: Array.from(entityTypes) }
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
      .attr("opacity", 0.7)
      .on("mouseover", function(_, d: any) {
        d3.select(this).attr("opacity", 0.8)
        
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
        `)
      })
      .on("mousemove", function(event) {
        const tooltip = d3.select(".tooltip")
        tooltip
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 10) + "px")
      })
      .on("mouseout", function() {
        d3.select(this).attr("opacity", 0.5)
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
      }`}>Wallet Flow Analysis (Real Transaction Data)</h4>
      <p className={`text-sm mb-4 ${
        theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
      }`}>
        Showing Bitcoin (BTC) flow amounts between {nodes.length - 1} wallets from {transactionData?.txs?.length || 0} transactions (sorted by highest BTC amount)
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
            <div className={`mt-4 pt-4`}>
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
                        backgroundColor: getColorForEntityType(type.toLowerCase()),
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
            }`}>No transaction data available for flow analysis. Try searching for a different address.</p>
          </div>
        )}
      </div>
    </>
  )
} 