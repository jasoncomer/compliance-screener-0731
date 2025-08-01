"use client"

import { useEffect, useRef, useMemo, useState, useCallback } from "react"
import * as d3 from "d3"
import { sankey, sankeyLinkHorizontal, SankeyGraph, SankeyNode, SankeyLink } from "d3-sankey"
import { riskScores } from "../../../lib/risk-scores"
import { getColorForEntityType, getEmojiForEntityType } from "../../../lib/entity-types"
import { useTheme } from "../../../context/ThemeContext"

interface FundsDataPoint {
  name: string
  value: number
  entityType: string
}

interface CustomSankeyNode extends SankeyNode<any, any> {
  id: string
  name: string
  color: string
  riskScore?: number
  entityType: string
}

interface CustomSankeyLink extends SankeyLink<any, any> {
  source: CustomSankeyNode
  target: CustomSankeyNode
  value: number
  label: string
  color: string
  riskScore?: number
}

interface EnhancedD3SankeyDiagramProps {
  incomingData: FundsDataPoint[]
  outgoingData: FundsDataPoint[]
  title?: string
  width?: number
  height?: number
  enableZoom?: boolean
  enablePan?: boolean
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

export const EnhancedD3SankeyDiagram = ({ 
  incomingData, 
  outgoingData, 
  title = "Funds Flow Analysis",
  width = 800,
  height = 600,
  enableZoom = true,
  enablePan = true
}: EnhancedD3SankeyDiagramProps) => {
  const { theme } = useTheme()
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width, height })

  // Responsive resize handler
  const handleResize = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      setDimensions({
        width: rect.width,
        height: Math.max(400, rect.height)
      })
    }
  }, [])

  useEffect(() => {
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [handleResize])

  const { nodes, links, uniqueEntityTypes } = useMemo(() => {
    const nodeMap = new Map<string, number>()
    const currentNodes: CustomSankeyNode[] = []
    const currentLinks: Omit<CustomSankeyLink, 'source' | 'target'>[] = []
    const entityTypes = new Set<string>()

    const addNode = (name: string, entityType: string, riskScore?: number) => {
      if (!nodeMap.has(name)) {
        const color = name === "Wallet" ? DEFAULT_COLOR : getColorForEntityType(entityType.toLowerCase())
        nodeMap.set(name, currentNodes.length)
        currentNodes.push({ 
          id: name, 
          name, 
          color, 
          riskScore, 
          entityType,
          x0: 0, x1: 0, y0: 0, y1: 0, index: currentNodes.length
        })
      }
      return nodeMap.get(name)!
    }

    const centralNodeName = "Wallet"
    const centralNodeIndex = addNode(centralNodeName, "wallet", 0)

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
    const chartWidth = dimensions.width - margin.left - margin.right
    const chartHeight = dimensions.height - margin.top - margin.bottom

    // Create the main chart group
    const chartGroup = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`)

    // Create the Sankey generator
    const sankeyGenerator = sankey<CustomSankeyNode, CustomSankeyLink>()
      .nodeWidth(20)
      .nodePadding(10)
      .extent([[0, 0], [chartWidth, chartHeight]])

    // Prepare data for D3
    const sankeyData: SankeyGraph<CustomSankeyNode, CustomSankeyLink> = {
      nodes: nodes.map(node => ({ ...node })),
      links: links.map(link => ({ ...link }))
    }

    // Generate the Sankey layout
    const { nodes: sankeyNodes, links: sankeyLinks } = sankeyGenerator(sankeyData)

    // Create the link generator
    const linkGenerator = sankeyLinkHorizontal<CustomSankeyNode, CustomSankeyLink>()

    // Add zoom behavior if enabled
    if (enableZoom) {
      const zoom = d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.5, 3])
        .on("zoom", (event) => {
          chartGroup.attr("transform", event.transform)
        })

      svg.call(zoom as any)
    }

    // Add pan behavior if enabled
    if (enablePan) {
      svg.style("cursor", "grab")
      svg.on("mousedown", () => svg.style("cursor", "grabbing"))
      svg.on("mouseup", () => svg.style("cursor", "grab"))
    }

    // Add links
    chartGroup.append("g")
      .attr("class", "links")
      .selectAll("path")
      .data(sankeyLinks)
      .enter()
      .append("path")
      .attr("d", linkGenerator)
      .attr("stroke", (d) => d.color || DEFAULT_COLOR)
      .attr("stroke-width", (d) => Math.max(1, d.width || 1))
      .attr("fill", "none")
      .attr("opacity", 0.5)
      .style("cursor", "pointer")
      .on("mouseover", function(event, d) {
        d3.select(this).attr("opacity", 0.8)
        
        // Show tooltip
        const tooltip = d3.select("body").append("div")
          .attr("class", "sankey-tooltip")
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
          .style("max-width", "300px")

        tooltip.html(`
          <div class="font-semibold">${d.label}</div>
          ${d.riskScore !== undefined ? `<div class="text-gray-500">Risk Score: ${Math.round(d.riskScore)}</div>` : ''}
        `)
      })
      .on("mousemove", function(event) {
        const tooltip = d3.select(".sankey-tooltip")
        tooltip
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 10) + "px")
      })
      .on("mouseout", function() {
        d3.select(this).attr("opacity", 0.5)
        d3.select(".sankey-tooltip").remove()
      })

    // Add nodes
    const nodeGroup = chartGroup.append("g")
      .attr("class", "nodes")
      .selectAll("g")
      .data(sankeyNodes)
      .enter()
      .append("g")
      .attr("transform", (d) => `translate(${d.x0},${d.y0})`)
      .style("cursor", "pointer")

    // Add node rectangles
    nodeGroup.append("rect")
      .attr("height", (d) => d.y1 - d.y0)
      .attr("width", (d) => {
        // Make Wallet node wider
        const baseWidth = d.x1 - d.x0
        return d.name === "Wallet" ? Math.max(baseWidth, 30) : baseWidth
      })
      .attr("fill", (d) => d.color || DEFAULT_COLOR)
      .attr("opacity", 0.9)
      .attr("rx", 2)
      .attr("ry", 2)
      .on("mouseover", function(event, d) {
        d3.select(this).attr("opacity", 1)
        
        // Show tooltip
        const tooltip = d3.select("body").append("div")
          .attr("class", "sankey-tooltip")
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
        const tooltip = d3.select(".sankey-tooltip")
        tooltip
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 10) + "px")
      })
      .on("mouseout", function() {
        d3.select(this).attr("opacity", 0.9)
        d3.select(".sankey-tooltip").remove()
      })

    // Add node labels
    nodeGroup.append("text")
      .attr("x", (d) => d.x0 < chartWidth / 2 ? -6 : 6)
      .attr("y", (d) => (d.y1 - d.y0) / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", (d) => d.x0 < chartWidth / 2 ? "end" : "start")
      .attr("fill", theme === 'dark' ? "#ffffff" : "#000000")
      .attr("font-size", "12px")
      .attr("font-weight", "500")
      .text((d) => d.name.replace(/In: |Out: /g, ""))

  }, [nodes, links, dimensions, theme, enableZoom, enablePan])

  return (
    <>
      <h4 className={`text-xl font-semibold mb-6 ${
        theme === 'dark' ? 'text-white' : 'text-gray-900'
      }`}>{title}</h4>
      <div 
        ref={containerRef}
        className={`p-6 ${
          theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-50'
        }`}
      >
        {links.length > 0 ? (
          <>
            <div style={{ width: "100%", overflow: "auto" }}>
              <svg
                ref={svgRef}
                width={dimensions.width}
                height={dimensions.height}
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
              {(enableZoom || enablePan) && (
                <div className="mt-2 text-xs text-gray-500">
                  {enableZoom && "Scroll to zoom • "}
                  {enablePan && "Drag to pan"}
                </div>
              )}
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