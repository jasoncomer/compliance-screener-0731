"use client"

import { useEffect, useRef, useMemo } from "react"
import * as d3 from "d3"
import { sankey, sankeyLinkHorizontal } from "d3-sankey"
import { riskScores } from "../../../lib/risk-scores"
import { getColorForEntityType, getEmojiForEntityType } from "../../../lib/entity-types"
import { useTheme } from "../../../context/ThemeContext"

interface FundsDataPoint {
  name: string
  value: number
  entityType: string
}

interface SankeyNode {
  id: string
  name: string
  color: string
  riskScore?: number
  entityType: string
}

interface SankeyLink {
  source: string
  target: string
  value: number
  label: string
  color: string
  riskScore?: number
}

interface D3SankeyDiagramProps {
  incomingData: FundsDataPoint[]
  outgoingData: FundsDataPoint[]
  title?: string
  width?: number
  height?: number
}

const DEFAULT_COLOR = "hsl(240, 5%, 80%)"

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

export const D3SankeyDiagram = ({ 
  incomingData, 
  outgoingData, 
  title = "Funds Flow Analysis",
  width = 800,
  height = 600 
}: D3SankeyDiagramProps) => {
  const { theme } = useTheme()
  const svgRef = useRef<SVGSVGElement>(null)

  const { nodes, links, uniqueEntityTypes } = useMemo(() => {
    const nodeMap = new Map<string, number>()
    const currentNodes: SankeyNode[] = []
    const currentLinks: SankeyLink[] = []
    const entityTypes = new Set<string>()

    const addNode = (name: string, entityType: string, riskScore?: number) => {
      if (!nodeMap.has(name)) {
        const color = name === "Wallet" ? DEFAULT_COLOR : getColorForEntityType(entityType.toLowerCase())
        nodeMap.set(name, currentNodes.length)
        currentNodes.push({ id: name, name, color, riskScore, entityType })
      }
      return nodeMap.get(name)!
    }

    const centralNodeName = "Wallet"
    addNode(centralNodeName, "wallet", 0)

    const enrichedIncomingData = incomingData.map((d) => ({
      ...d,
      riskScore: riskScores[d.entityType.toLowerCase()] ?? 35,
    }))
    const enrichedOutgoingData = outgoingData.map((d) => ({
      ...d,
      riskScore: riskScores[d.entityType.toLowerCase()] ?? 35,
    }))

    const totalIncomingValue = enrichedIncomingData.reduce((sum, item) => sum + item.value, 0)

    enrichedIncomingData.forEach((item) => {
      entityTypes.add(item.entityType)
      addNode(`In: ${item.entityType}`, item.entityType, item.riskScore)
      currentLinks.push({
        source: `In: ${item.entityType}`,
        target: centralNodeName,
        value: item.value,
        label: `${item.entityType} → Wallet: ${formatCurrency(item.value)}`,
        color: getColorFromRisk(item.riskScore),
        riskScore: item.riskScore,
      })
    })

    enrichedOutgoingData.forEach((item) => {
      entityTypes.add(item.entityType)
      addNode(`Out: ${item.entityType}`, item.entityType, item.riskScore)
      currentLinks.push({
        source: centralNodeName,
        target: `Out: ${item.entityType}`,
        value: item.value,
        label: `Wallet → ${item.entityType}: ${formatCurrency(item.value)}`,
        color: getColorFromRisk(item.riskScore),
        riskScore: item.riskScore,
      })
    })

    const weightedRiskSum = enrichedIncomingData.reduce((sum, item) => sum + item.value * item.riskScore, 0)
    const averageRisk = totalIncomingValue > 0 ? weightedRiskSum / totalIncomingValue : 0

    const centralNode = currentNodes.find(node => node.name === centralNodeName)
    if (centralNode) {
      centralNode.color = getColorFromRisk(averageRisk)
      centralNode.riskScore = averageRisk
      centralNode.entityType = "Wallet"
    }

    if (!entityTypes.has("Wallet") && currentNodes.some((node) => node.entityType === "Wallet")) {
      entityTypes.add("Wallet")
    }

    return { nodes: currentNodes, links: currentLinks, uniqueEntityTypes: Array.from(entityTypes) }
  }, [incomingData, outgoingData])

  useEffect(() => {
    if (!svgRef.current || links.length === 0) return

    // Clear previous content
    d3.select(svgRef.current).selectAll("*").remove()

    const svg = d3.select(svgRef.current)
    const margin = { top: 20, right: 150, bottom: 20, left: 150 }
    const chartWidth = width - margin.left - margin.right
    const chartHeight = height - margin.top - margin.bottom

    // Create the Sankey generator
    const sankeyGenerator = sankey()
      .nodeWidth(20)
      .nodePadding(10)
      .extent([[0, 0], [chartWidth, chartHeight]])

    // Prepare data for D3 - create minimal nodes and links with indices
    const sankeyNodesInput = nodes.map(() => ({}))
    const sankeyLinksInput = links.map((link) => {
      const sourceIndex = nodes.findIndex(node => node.name === link.source)
      const targetIndex = nodes.findIndex(node => node.name === link.target)
      return {
        source: sourceIndex,
        target: targetIndex,
        value: link.value,
        label: link.label,
        color: link.color
      }
    }).filter(link => link.source !== -1 && link.target !== -1)

    // Generate the Sankey layout
    const { nodes: sankeyNodes, links: sankeyLinks } = sankeyGenerator({
      nodes: sankeyNodesInput,
      links: sankeyLinksInput
    })

    // Create the link generator
    const linkGenerator = sankeyLinkHorizontal()

    // Add links
    svg.append("g")
      .selectAll("path")
      .data(sankeyLinks)
      .enter()
      .append("path")
      .attr("d", linkGenerator as any)
      .attr("stroke", (d: any) => d.color || DEFAULT_COLOR)
      .attr("stroke-width", (d: any) => Math.max(1, d.width))
      .attr("fill", "none")
      .attr("opacity", 0.5)
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
          ${d.riskScore !== undefined ? `<div class="text-gray-500">Risk Score: ${Math.round(d.riskScore)}</div>` : ''}
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
      .selectAll("g")
      .data(sankeyNodes)
      .enter()
      .append("g")
      .attr("transform", (d: any) => `translate(${d.x0},${d.y0})`)

    // Add node rectangles
    nodeGroup.append("rect")
      .attr("height", (d: any) => d.y1 - d.y0)
      .attr("width", (d: any) => {
        // Make Wallet node wider
        const baseWidth = d.x1 - d.x0
        return d.name === "Wallet" ? Math.max(baseWidth, 30) : baseWidth
      })
      .attr("fill", (d: any) => d.color || DEFAULT_COLOR)
      .attr("opacity", 0.9)
      .attr("rx", 2)
      .attr("ry", 2)
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
        tooltip.html(`
          <div class="font-semibold">${displayName}</div>
          ${d.riskScore !== undefined ? `<div class="text-gray-500">Risk Score: ${Math.round(d.riskScore)}</div>` : ''}
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

    // Add node labels
    nodeGroup.append("text")
      .attr("x", (d: any) => d.x0 < chartWidth / 2 ? -6 : 6)
      .attr("y", (d: any) => (d.y1 - d.y0) / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", (d: any) => d.x0 < chartWidth / 2 ? "end" : "start")
      .attr("fill", theme === 'dark' ? "#ffffff" : "#000000")
      .attr("font-size", "12px")
      .text((d: any) => d.name.replace(/In: |Out: /g, ""))

  }, [nodes, links, width, height, theme])

  return (
    <>
      <h4 className={`text-xl font-semibold mb-6 ${
        theme === 'dark' ? 'text-white' : 'text-gray-900'
      }`}>{title}</h4>
      <div className={`p-6 ${
        theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-50'
      }`}>
        {links.length > 0 ? (
          <>
            <div style={{ width: "100%", overflow: "auto" }}>
              <svg
                ref={svgRef}
                width={width}
                height={height}
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