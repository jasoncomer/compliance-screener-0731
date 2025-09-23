"use client"

import { useEffect, useMemo, useRef, useState } from "react"

import * as d3 from "d3"
import { sankey, sankeyLinkHorizontal } from "d3-sankey"

import { useAttribution } from "../../../context/AttributionContext"
import { useTheme } from "../../../context/ThemeContext"
import { useAddressTransactions } from "../../../hooks/useAddressTransactions"
import { useAppSelector } from "../../../store/hooks"
import { RootState } from "../../../store/store"
import { BtcTransaction } from "../../../typings/BtcTransaction"
import { applyBeneficialOwnerOverride } from "../../../utils/entityUtils"

interface SimpleSankeyTestProps {
  address: string
  maxTransactions?: number
  addressSummaryData?: {
    total_received: number
    total_spent: number
    balance: number
  }
}

interface WalletModalData {
  entityName: string
  addresses: string[]
  entityType: string
  direction: 'incoming' | 'outgoing'
  totalValue: number
  attribution?: any
}

interface OutgoingEntityFlow {
  amount: number
  transactionIds: string[]
  entityType: string
  properName: string
  addresses: string[]
  outputProportion?: number
  actualOutputAmount?: number
  totalOutputAmount?: number
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
  transactionId?: string
  transactionCount?: number
  inputAddresses?: string[]
  outputAddresses?: string[]
}

interface CenterWalletModalData {
  address: string
  totalIncoming: number
  totalOutgoing: number
  netFlow: number
  attribution?: any
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
  targetAddress?: string
  outputProportion?: number
}

// const DEFAULT_COLOR = "hsl(30, 100%, 50%)" // Orange default

// Risk-based color palette for different entity types and flow directions
const COLOR_PALETTE = {
  // Incoming flows (green tones) - risk-based
  incoming: {
    // Low risk entities (green tones)
    'centralized exchange': "hsl(120, 70%, 50%)",     // Bright green
    'decentralized exchange': "hsl(130, 70%, 50%)",   // Green
    'bank': "hsl(140, 70%, 50%)",                     // Light green
    'financial institution': "hsl(150, 70%, 50%)",    // Green-cyan
    'government': "hsl(160, 70%, 50%)",               // Cyan-green
    
    // Medium risk entities (yellow-green tones)
    'mining': "hsl(80, 70%, 50%)",                    // Yellow-green
    'mining pool': "hsl(90, 70%, 50%)",               // Light yellow-green
    'defi': "hsl(100, 70%, 50%)",                     // Green-yellow
    'gaming': "hsl(110, 70%, 50%)",                   // Yellow-green
    
    // High risk entities (orange-red tones)
    'gambling': "hsl(30, 80%, 50%)",                  // Orange
    'mixer': "hsl(20, 80%, 50%)",                     // Red-orange
    'darknet': "hsl(10, 80%, 50%)",                   // Red
    'scam': "hsl(0, 80%, 50%)",                       // Bright red
    'ofac sanctioned': "hsl(0, 90%, 40%)",            // Dark red
    
    // Unknown/other entities
    'unknown': "hsl(200, 50%, 50%)",                  // Blue-gray
    'wallet': "hsl(180, 50%, 50%)",                   // Cyan
    'default': "hsl(130, 70%, 50%)"                   // Default green
  },
  // Outgoing flows (red/purple tones) - risk-based
  outgoing: {
    // Low risk entities (blue tones)
    'centralized exchange': "hsl(200, 70%, 50%)",     // Blue
    'decentralized exchange': "hsl(210, 70%, 50%)",   // Light blue
    'bank': "hsl(220, 70%, 50%)",                     // Blue-purple
    'financial institution': "hsl(230, 70%, 50%)",    // Purple-blue
    'government': "hsl(240, 70%, 50%)",               // Purple
    
    // Medium risk entities (purple-pink tones)
    'mining': "hsl(280, 70%, 50%)",                   // Purple
    'mining pool': "hsl(290, 70%, 50%)",              // Light purple
    'defi': "hsl(300, 70%, 50%)",                     // Magenta-purple
    'gaming': "hsl(310, 70%, 50%)",                   // Pink-purple
    
    // High risk entities (red tones)
    'gambling': "hsl(0, 80%, 50%)",                   // Red
    'mixer': "hsl(350, 80%, 50%)",                    // Red-pink
    'darknet': "hsl(340, 80%, 50%)",                  // Dark red
    'scam': "hsl(330, 90%, 50%)",                     // Bright red
    'ofac sanctioned': "hsl(320, 90%, 40%)",          // Dark red
    
    // Unknown/other entities
    'unknown': "hsl(0, 30%, 50%)",                    // Gray-red
    'wallet': "hsl(0, 40%, 50%)",                     // Light gray-red
    'default': "hsl(0, 70%, 50%)"                     // Default red
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
  
  // Normalize entity type for color selection
  const normalizedEntityType = entityType.toLowerCase().trim()
  let baseColor: string
  
  // Check for exact matches first (most specific)
  if (palette[normalizedEntityType as keyof typeof palette]) {
    baseColor = palette[normalizedEntityType as keyof typeof palette] as string
  } else if (normalizedEntityType.includes('centralized exchange') || normalizedEntityType.includes('cex')) {
    baseColor = palette['centralized exchange']
  } else if (normalizedEntityType.includes('decentralized exchange') || normalizedEntityType.includes('dex')) {
    baseColor = palette['decentralized exchange']
  } else if (normalizedEntityType.includes('mining pool')) {
    baseColor = palette['mining pool']
  } else if (normalizedEntityType.includes('mining')) {
    baseColor = palette['mining']
  } else if (normalizedEntityType.includes('defi') || normalizedEntityType.includes('uniswap') || normalizedEntityType.includes('compound')) {
    baseColor = palette['defi']
  } else if (normalizedEntityType.includes('gambling') || normalizedEntityType.includes('casino') || normalizedEntityType.includes('bet')) {
    baseColor = palette['gambling']
  } else if (normalizedEntityType.includes('mixer') || normalizedEntityType.includes('tornado') || normalizedEntityType.includes('privacy')) {
    baseColor = palette['mixer']
  } else if (normalizedEntityType.includes('darknet') || normalizedEntityType.includes('market') || normalizedEntityType.includes('silk')) {
    baseColor = palette['darknet']
  } else if (normalizedEntityType.includes('scam') || normalizedEntityType.includes('fraud')) {
    baseColor = palette['scam']
  } else if (normalizedEntityType.includes('ofac') || normalizedEntityType.includes('sanctioned')) {
    baseColor = palette['ofac sanctioned']
  } else if (normalizedEntityType.includes('bank') || normalizedEntityType.includes('financial institution')) {
    baseColor = palette['bank']
  } else if (normalizedEntityType.includes('government') || normalizedEntityType.includes('gov')) {
    baseColor = palette['government']
  } else if (normalizedEntityType.includes('gaming') || normalizedEntityType.includes('game')) {
    baseColor = palette['gaming']
  } else if (normalizedEntityType.includes('wallet') || normalizedEntityType.includes('personal')) {
    baseColor = palette['wallet']
  } else if (normalizedEntityType === 'unknown' || normalizedEntityType === '') {
    baseColor = palette['unknown']
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

// Helper function to get entity information for an address - consistent with Risk Dashboard
const getEntityInfo = (address: string, attributions: any, itemsMap: any) => {
  const attribution = attributions[address]
  if (!attribution) {
    // Temporary workaround: Check if this is a known address
    const knownAxiAddresses = [
      'bc1qcy263qah032jdwpq725geexkud9nelvcchud0c'
    ]
    
    if (knownAxiAddresses.includes(address)) {
      // Create a mock attribution for Axi
      const entitySOT = Object.values(itemsMap).find((sot: any) => sot.entity_id === 'axi_com') as any
      const override = applyBeneficialOwnerOverride(
        { entity: 'axi_com', bo: '', custodian: '', script_type: '' },
        entitySOT,
        undefined,
        Object.values(itemsMap)
      )
      return {
        entityId: 'axi_com',
        entityType: override.entityType,
        displayName: override.displayTitle,
        properName: override.displayTitle
      }
    }
    
    return {
      entityId: null,
      entityType: "Unknown",
      displayName: address.slice(0, 8) + "...",
      properName: null
    }
  }

  // Use the same beneficial owner override logic as Risk Dashboard
  const entitySOT = Object.values(itemsMap).find((sot: any) => sot.entity_id === attribution.entity) as any
  const beneficialOwnerSOT = attribution.bo ? 
    Object.values(itemsMap).find((sot: any) => sot.entity_id === attribution.bo) as any : undefined
  
  const override = applyBeneficialOwnerOverride(
    {
      entity: attribution.entity,
      bo: attribution.bo || '',
      custodian: attribution.custodian || '',
      script_type: attribution.script_type
    },
    entitySOT,
    beneficialOwnerSOT,
    Object.values(itemsMap)
  )
  
  return {
    entityId: attribution.entity,
    entityType: override.entityType,
    displayName: override.displayTitle,
    properName: override.displayTitle
  }
}

// Helper function to resolve entity ID using the same priority as FlowTrace
const resolveEntityId = (address: string, attributions: any): string | null => {
  const attribution = attributions[address]
  if (!attribution) {
    // Temporary workaround: Check if this is a known CashApp address
    // This should be removed once all CashApp addresses have proper attribution data
    const knownCashAppAddresses = [
      'bc1qq9t4w4pl5ek5w8h0eylcajydcqvn53p0y2pmm7',
      'bc1ql9mlwflgsnz8hlydxxu43a6fq5d5gpr52t4zwu', 
      'bc1q95w0zmnw87vxl5uav0tjqhc0g7x724zw0yehw7',
      'bc1q8nxvakurs6wlh9w20sdtesefaldcp0mvg8zgq2'
    ]
    
    const knownAxiAddresses = [
      'bc1qcy263qah032jdwpq725geexkud9nelvcchud0c'
    ]
    
    if (knownCashAppAddresses.includes(address)) {
      return 'cash_app'
    }
    
    if (knownAxiAddresses.includes(address)) {
      return 'axi_com'
    }
    
    return null
  }
  
  // Priority: entity → bo → custodian
  return attribution.entity || attribution.bo || attribution.custodian || null
}


export const SimpleSankeyTest = ({ 
  address, 
  maxTransactions = 20
}: SimpleSankeyTestProps) => {
  try {
  const { theme } = useTheme()
  const svgRef = useRef<SVGSVGElement>(null)
  const [modalData, setModalData] = useState<WalletModalData | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [linkModalData, setLinkModalData] = useState<LinkModalData | null>(null)
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false)

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      // You could add a toast notification here if you have one
    } catch (err) {
      console.error('Failed to copy: ', err)
    }
  }
  const [centerWalletModalData, setCenterWalletModalData] = useState<CenterWalletModalData | null>(null)
  const [isCenterWalletModalOpen, setIsCenterWalletModalOpen] = useState(false)

  // Fetch transaction data - get all transactions (increased limit for better analysis)
  const { data: transactionData, isLoading: isLoadingTransactions } = useAddressTransactions(address, 1, 100)
  const { attributions } = useAttribution()
  const { itemsMap } = useAppSelector((state: RootState) => state.sot)

  // Logo state management for each node
  const [nodeLogos, setNodeLogos] = useState<Record<string, string | null>>({})

  // Function to fetch logo for a single entity using Image() to avoid CORS issues
  const fetchEntityLogo = async (entityId: string): Promise<string | null> => {
    if (!entityId) return null
    
    // Special case for mining rewards - use pickaxe emoji
    if (entityId === 'mining_reward') {
      return '⛏️' // Pickaxe emoji for mining rewards
    }
    
    return new Promise((resolve) => {
      // Try JPG first
      const jpgUrl = `https://storage.googleapis.com/entity-logos/${entityId}.jpg`
      const jpgImg = new Image()
      
      jpgImg.onload = () => resolve(jpgUrl)
      jpgImg.onerror = () => {
        // Try PNG fallback
        const pngUrl = `https://storage.googleapis.com/entity-logos/${entityId}.png`
        const pngImg = new Image()
        
        pngImg.onload = () => resolve(pngUrl)
        pngImg.onerror = () => resolve(null)
        pngImg.src = pngUrl
      }
      
      jpgImg.src = jpgUrl
    })
  }

  // Function to fetch logos for all nodes
  const fetchAllNodeLogos = async (nodes: SankeyNode[]) => {
    console.log('🎨 Fetching logos for nodes:', nodes.length, 'nodes')
    const entityNodes = nodes.filter(node => node.type === 'entity' && node.entityGroup)
    console.log('🎨 Entity nodes to fetch logos for:', entityNodes.map(n => ({ id: n.id, entityGroup: n.entityGroup })))
    
    const logoPromises = nodes.map(async (node) => {
      if (node.type === 'entity' && node.entityGroup) {
        console.log('🎨 Fetching logo for entity:', node.entityGroup)
        const logoUrl = await fetchEntityLogo(node.entityGroup)
        console.log('🎨 Logo result for', node.entityGroup, ':', logoUrl ? '✅ Found' : '❌ Not found')
        return { nodeId: node.id, logoUrl }
      }
      return { nodeId: node.id, logoUrl: null }
    })
    
    const results = await Promise.all(logoPromises)
    const logoMap: Record<string, string | null> = {}
    results.forEach(({ nodeId, logoUrl }) => {
      logoMap[nodeId] = logoUrl
    })
    
    console.log('🎨 Final logo map:', logoMap)
    setNodeLogos(logoMap)
  }

  // Get the proper entity name for the central address
  const centralEntityInfo = getEntityInfo(address, attributions, itemsMap)
  const centralEntityName = centralEntityInfo.displayName || address.slice(0, 8) + "..."

  // Process real transaction data with entity_id aggregation
  const { 
    nodes, 
    links, 
    totalIncomingEntities, 
    totalOutgoingEntities, 
    totalInputTransactions, 
    totalOutputTransactions, 
    displayedIncomingEntities, 
    displayedOutgoingEntities 
  } = useMemo(() => {

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
    
    if (addressTransactions.length === 0) {
      return { 
        nodes: currentNodes, 
        links: currentLinks, 
        uniqueEntityTypes: Array.from(entityTypes),
        totalIncomingEntities: 0,
        totalOutgoingEntities: 0,
        totalInputTransactions: 0,
        totalOutputTransactions: 0,
        displayedIncomingEntities: 0,
        displayedOutgoingEntities: 0
      }
    }

    // Aggregate flows by entity_id
    const incomingEntityFlows = new Map<string, { 
      amount: number; 
      transactionIds: string[]; 
      entityType: string; 
      properName: string;
      addresses: string[];
    }>()
    const outgoingEntityFlows = new Map<string, OutgoingEntityFlow>()

    addressTransactions.forEach((tx: BtcTransaction) => {
      
      // Check if this address is receiving (has outputs to this address)
      const outputsToAddress = tx.outputs.filter(output => output.addr === address)
      const inputsFromAddress = tx.inputs.filter(input => input.addr === address)
      
      console.log(`🔨 Address involvement:`, {
        outputsToAddress: outputsToAddress.length,
        inputsFromAddress: inputsFromAddress.length,
        totalReceived: outputsToAddress.reduce((sum, output) => sum + output.amt, 0),
        totalSent: inputsFromAddress.reduce((sum, input) => sum + input.amt, 0)
      })
      
      // Process incoming flows (when address receives)
      if (outputsToAddress.length > 0) {
        const totalReceived = outputsToAddress.reduce((sum, output) => sum + output.amt, 0)
        
        // Check if this is a mining reward (coinbase) transaction
        // Mining rewards are identified by having no real input transactions or coinbase flag
        const isMiningReward = tx.coinbase === true || 
          (tx.inputs && tx.inputs.length === 0) ||
          (tx.inputs && tx.inputs.length > 0 && 
           tx.inputs.every(input => !input.intxid || input.intxid === '0000000000000000000000000000000000000000000000000000000000000000'))
        
        console.log('🔨 Mining reward check:', {
          coinbase: tx.coinbase,
          inputsCount: tx.inputs?.length || 0,
          hasValidInputs: tx.inputs?.some(input => input.intxid && input.intxid !== '0000000000000000000000000000000000000000000000000000000000000000'),
          isMiningReward
        })
        
        if (isMiningReward) {
          console.log('🔨 Mining reward detected for address:', address, 'Amount:', totalReceived, 'TX:', tx.txid)
          console.log('🔨 Transaction details:', { coinbase: tx.coinbase, inputs: tx.inputs, outputs: tx.outputs })
          // For mining rewards, create a special "Mining Reward" entity
          const miningRewardKey = "mining_reward"
          const miningRewardAmount = totalReceived // The entire received amount is from mining
          
          console.log('🔨 Adding mining reward to incoming flows:', { key: miningRewardKey, amount: miningRewardAmount })
          
          const existing = incomingEntityFlows.get(miningRewardKey)
          
          if (existing) {
            existing.amount += miningRewardAmount
            existing.transactionIds.push(tx.txid)
            console.log('🔨 Updated existing mining reward flow:', existing)
          } else {
            const newFlow = {
              amount: miningRewardAmount,
              transactionIds: [tx.txid],
              entityType: "Mining",
              properName: "Mining Reward",
              addresses: [] // Mining rewards don't have source addresses
            }
            incomingEntityFlows.set(miningRewardKey, newFlow)
            console.log('🔨 Created new mining reward flow:', newFlow)
          }
        } else {
          // Regular transaction - process source addresses
          const sourceAddresses = tx.inputs.filter(input => input.addr !== address)
          
          // Group by entity_id
          const sourceEntityMap = new Map<string, { addresses: string[]; totalAmount: number }>()
          
          sourceAddresses.forEach(input => {
            const entityId = resolveEntityId(input.addr, attributions)
            const key = entityId || input.addr // Use entity_id or address as fallback
            
            
            if (sourceEntityMap.has(key)) {
              sourceEntityMap.get(key)!.addresses.push(input.addr)
              sourceEntityMap.get(key)!.totalAmount += input.amt
            } else {
              sourceEntityMap.set(key, {
                addresses: [input.addr],
                totalAmount: input.amt
              })
            }
          })
          
          // Distribute received amount proportionally to entity groups
          const totalSourceAmount = Array.from(sourceEntityMap.values()).reduce((sum, group) => sum + group.totalAmount, 0)
          
          sourceEntityMap.forEach((group, entityKey) => {
            const proportion = group.totalAmount / totalSourceAmount
            const receivedAmount = totalReceived * proportion
            
            
            // Get entity info for display
            const firstAddress = group.addresses[0]
            const { entityType, properName } = getEntityInfo(firstAddress, attributions, itemsMap)
            const displayName = properName || firstAddress.slice(0, 8) + "..."
            
            const existing = incomingEntityFlows.get(entityKey)
            
            if (existing) {
              existing.amount += receivedAmount
              existing.transactionIds.push(tx.txid)
              // Add new addresses if not already present
              group.addresses.forEach(addr => {
                if (!existing.addresses.includes(addr)) {
                  existing.addresses.push(addr)
                }
              })
            } else {
              incomingEntityFlows.set(entityKey, {
                amount: receivedAmount,
                transactionIds: [tx.txid],
                entityType,
                properName: displayName,
                addresses: [...group.addresses]
              })
            }
          })
        }
      }
      
      // Process outgoing flows (when address sends)
      if (inputsFromAddress.length > 0) {
        const totalSent = inputsFromAddress.reduce((sum, input) => sum + input.amt, 0)
        
        // Get destination addresses (excluding the current address)
        const destAddresses = tx.outputs.filter(output => output.addr !== address)
        
        // Group outgoing flows by entity_id (same as incoming flows)
        const destEntityMap = new Map<string, { addresses: string[]; totalAmount: number }>()
        
        destAddresses.forEach(output => {
          const entityId = resolveEntityId(output.addr, attributions)
          const key = entityId || output.addr // Use entity_id or address as fallback
          
          if (destEntityMap.has(key)) {
            destEntityMap.get(key)!.addresses.push(output.addr)
            destEntityMap.get(key)!.totalAmount += output.amt
          } else {
            destEntityMap.set(key, {
              addresses: [output.addr],
              totalAmount: output.amt
            })
          }
        })
        
        // Distribute sent amount proportionally to entity groups
        const totalDestAmount = Array.from(destEntityMap.values()).reduce((sum, group) => sum + group.totalAmount, 0)
        
        destEntityMap.forEach((group, entityKey) => {
          const proportion = group.totalAmount / totalDestAmount
          const sentAmount = totalSent * proportion
          
          
          // Get entity info for display
          const firstAddress = group.addresses[0]
          const { entityType, properName } = getEntityInfo(firstAddress, attributions, itemsMap)
          const displayName = properName || firstAddress.slice(0, 8) + "..."
          
          const existing = outgoingEntityFlows.get(entityKey)
          
          if (existing) {
            existing.amount += sentAmount
            existing.transactionIds.push(tx.txid)
            // Add new addresses if not already present
            group.addresses.forEach(addr => {
              if (!existing.addresses.includes(addr)) {
                existing.addresses.push(addr)
              }
            })
          } else {
             outgoingEntityFlows.set(entityKey, {
               amount: sentAmount,
               transactionIds: [tx.txid],
               entityType,
               properName: displayName,
               addresses: [...group.addresses],
               // Store additional info for proportional flow visualization
               outputProportion: proportion,
               actualOutputAmount: group.totalAmount,
               totalOutputAmount: totalDestAmount
             })
          }
        })
      }
      
      // Handle cospending case: if address both receives and sends in same transaction
      // This is the key fix - when an address receives from one entity and sends to others in the same tx
      if (outputsToAddress.length > 0 && inputsFromAddress.length > 0) {
        
        // The received amount should equal the sent amount (minus fees)
        // This represents the flow through the address
        const netFlow = outputsToAddress.reduce((sum, output) => sum + output.amt, 0)
        
        // Process the flow from source entities to destination entities
        const sourceAddresses = tx.inputs.filter(input => input.addr !== address)
        const destAddresses = tx.outputs.filter(output => output.addr !== address)
        
        // Group sources by entity_id
        const sourceEntityMap = new Map<string, { addresses: string[]; totalAmount: number }>()
        
        // Check if this is a mining reward transaction
        const isMiningReward = tx.coinbase === true || 
          (tx.inputs && tx.inputs.length === 0) ||
          (tx.inputs && tx.inputs.length > 0 && 
           tx.inputs.every(input => !input.intxid || input.intxid === '0000000000000000000000000000000000000000000000000000000000000000'))
        
        if (isMiningReward) {
          console.log('🔨 Cospending mining reward detected for address:', address, 'Amount:', netFlow, 'TX:', tx.txid)
          // For mining rewards in cospending, the source is mining
          sourceEntityMap.set("mining_reward", {
            addresses: [],
            totalAmount: netFlow // The entire flow is from mining
          })
        } else {
          // Regular transaction - process source addresses
          sourceAddresses.forEach(input => {
            const entityId = resolveEntityId(input.addr, attributions)
            const key = entityId || input.addr
            
            if (sourceEntityMap.has(key)) {
              sourceEntityMap.get(key)!.addresses.push(input.addr)
              sourceEntityMap.get(key)!.totalAmount += input.amt
            } else {
              sourceEntityMap.set(key, {
                addresses: [input.addr],
                totalAmount: input.amt
              })
            }
          })
        }
        
        // Group destinations by entity_id
        const destEntityMap = new Map<string, { addresses: string[]; totalAmount: number }>()
        destAddresses.forEach(output => {
          const entityId = resolveEntityId(output.addr, attributions)
          const key = entityId || output.addr
          
          if (destEntityMap.has(key)) {
            destEntityMap.get(key)!.addresses.push(output.addr)
            destEntityMap.get(key)!.totalAmount += output.amt
          } else {
            destEntityMap.set(key, {
              addresses: [output.addr],
              totalAmount: output.amt
            })
          }
        })
        
        // Create direct flows from source entities to destination entities
        const totalSourceAmount = Array.from(sourceEntityMap.values()).reduce((sum, group) => sum + group.totalAmount, 0)
        const totalDestAmount = Array.from(destEntityMap.values()).reduce((sum, group) => sum + group.totalAmount, 0)
        
        sourceEntityMap.forEach((sourceGroup, sourceEntityKey) => {
          const sourceProportion = sourceGroup.totalAmount / totalSourceAmount
          
          destEntityMap.forEach((destGroup, destEntityKey) => {
            const destProportion = destGroup.totalAmount / totalDestAmount
            const flowAmount = netFlow * sourceProportion * destProportion
            
            // Get entity info for both source and destination
            let sourceEntityType, sourceDisplayName
            if (sourceEntityKey === "mining_reward") {
              sourceEntityType = "Mining"
              sourceDisplayName = "Mining Reward"
            } else {
              const sourceFirstAddress = sourceGroup.addresses[0]
              const { entityType, properName } = getEntityInfo(sourceFirstAddress, attributions, itemsMap)
              sourceEntityType = entityType
              sourceDisplayName = properName || sourceFirstAddress.slice(0, 8) + "..."
            }
            
            const destFirstAddress = destGroup.addresses[0]
            const { entityType: destEntityType, properName: destProperName } = getEntityInfo(destFirstAddress, attributions, itemsMap)
            const destDisplayName = destProperName || destFirstAddress.slice(0, 8) + "..."
            
            // Add to incoming flows (source to address)
            const incomingKey = sourceEntityKey
            const existingIncoming = incomingEntityFlows.get(incomingKey)
            if (existingIncoming) {
              existingIncoming.amount += flowAmount
              existingIncoming.transactionIds.push(tx.txid)
            } else {
              incomingEntityFlows.set(incomingKey, {
                amount: flowAmount,
                transactionIds: [tx.txid],
                entityType: sourceEntityType,
                properName: sourceDisplayName,
                addresses: [...sourceGroup.addresses]
              })
            }
            
            // Add to outgoing flows (address to destination)
            const outgoingKey = destEntityKey
            const existingOutgoing = outgoingEntityFlows.get(outgoingKey)
            if (existingOutgoing) {
              existingOutgoing.amount += flowAmount
              existingOutgoing.transactionIds.push(tx.txid)
            } else {
              outgoingEntityFlows.set(outgoingKey, {
                amount: flowAmount,
                transactionIds: [tx.txid],
                entityType: destEntityType,
                properName: destDisplayName,
                addresses: [...destGroup.addresses]
              })
            }
          })
        })
      }
    })

    // Calculate total entities before limiting
    const totalIncomingEntities = incomingEntityFlows.size
    const totalOutgoingEntities = outgoingEntityFlows.size
    const totalInputTransactions = Array.from(incomingEntityFlows.values()).reduce((sum, flow) => sum + flow.transactionIds.length, 0)
    const totalOutputTransactions = Array.from(outgoingEntityFlows.values()).reduce((sum, flow) => sum + flow.transactionIds.length, 0)
    
    console.log('🔨 Incoming entity flows map:', Array.from(incomingEntityFlows.entries()))
    console.log('🔨 Outgoing entity flows map:', Array.from(outgoingEntityFlows.entries()))
    
    // Limit flows to fit within 350px height (optimized for horizontal spacing)
    const maxFlowsPerDirection = 20 // Optimized for 350px height with increased node spacing
    
    // Sort and limit incoming entity flows
    const sortedIncomingFlows = Array.from(incomingEntityFlows.entries())
      .sort(([, a], [, b]) => b.amount - a.amount)
      .slice(0, maxFlowsPerDirection)
    
    // Sort and limit outgoing entity flows
    const sortedOutgoingFlows = Array.from(outgoingEntityFlows.entries())
      .sort(([, a], [, b]) => b.amount - a.amount)
      .slice(0, maxFlowsPerDirection)
    
    // Create nodes and links for incoming entity flows
    console.log('🔨 Processing incoming flows:', sortedIncomingFlows.length, 'flows')
    sortedIncomingFlows.forEach(([entityKey, flowData]) => {
      console.log('🔨 Processing incoming entity:', entityKey, 'amount:', flowData.amount, 'type:', flowData.entityType)
      entityTypes.add(flowData.entityType)
      
      const sourceNode: SankeyNode = {
        id: `In: ${entityKey}`,
        name: flowData.properName || entityKey.slice(0, 8) + "...",
        type: 'entity',
        entityType: flowData.entityType,
        entityGroup: entityKey,
        addresses: flowData.addresses,
        color: "hsl(210, 80%, 60%)" // Blue for incoming nodes
      }
      
      console.log('🔨 Created source node:', sourceNode)
      addNode(sourceNode)
      
      currentLinks.push({
        source: `In: ${entityKey}`,
        target: "Address",
        value: flowData.amount,
        label: `${flowData.properName || entityKey.slice(0, 8) + "..."} → ${centralEntityName}: ${formatCurrency(flowData.amount)} (${flowData.transactionIds.length} txs)`,
        color: getLinkColor(flowData.amount, 'incoming', flowData.entityType),
        transactionIds: flowData.transactionIds
      })
    })

    // Create nodes and links for outgoing entity flows
    sortedOutgoingFlows.forEach(([entityKey, flowData]) => {
      entityTypes.add(flowData.entityType)
      
      const targetNode: SankeyNode = {
        id: `Out: ${entityKey}`,
        name: flowData.properName || entityKey.slice(0, 8) + "...",
        type: 'entity',
        entityType: flowData.entityType,
        entityGroup: entityKey,
        addresses: flowData.addresses,
        color: "hsl(210, 80%, 60%)" // Blue for outgoing nodes
      }
      
      addNode(targetNode)
      
      currentLinks.push({
        source: "Address",
        target: `Out: ${entityKey}`,
        value: flowData.amount,
        label: `${centralEntityName} → ${flowData.properName || entityKey.slice(0, 8) + "..."}: ${formatCurrency(flowData.amount)} (${flowData.transactionIds.length} txs)${(flowData as OutgoingEntityFlow).outputProportion ? ` [${((flowData as OutgoingEntityFlow).outputProportion! * 100).toFixed(1)}%]` : ''}`,
        color: getLinkColor(flowData.amount, 'outgoing', flowData.entityType),
        transactionIds: flowData.transactionIds,
        targetAddress: entityKey, // Store the specific address for this link (entityKey is now the address)
        outputProportion: (flowData as OutgoingEntityFlow).outputProportion // Store the proportion for node sizing
      })
    })

    if (!entityTypes.has("Address")) {
      entityTypes.add("Address")
    }


    return { 
      nodes: currentNodes, 
      links: currentLinks, 
      uniqueEntityTypes: Array.from(entityTypes),
      totalIncomingEntities,
      totalOutgoingEntities,
      totalInputTransactions,
      totalOutputTransactions,
      displayedIncomingEntities: sortedIncomingFlows.length,
      displayedOutgoingEntities: sortedOutgoingFlows.length
    }
  }, [address, maxTransactions, transactionData, attributions, itemsMap])

  // Fetch logos when nodes change
  useEffect(() => {
    if (nodes.length > 0) {
      fetchAllNodeLogos(nodes)
    }
  }, [nodes])

  useEffect(() => {
    if (!svgRef.current || links.length === 0) return

    // Clear previous content
    d3.select(svgRef.current).selectAll("*").remove()

    const svg = d3.select(svgRef.current)
    const margin = { top: 20, right: 250, bottom: 20, left: 250 }
    const width = 1400
    const height = 350
    const chartWidth = width - margin.left - margin.right
    const chartHeight = height - margin.top - margin.bottom

    // Create the Sankey generator
    const sankeyGenerator = sankey()
      .nodeWidth(35)
      .nodePadding(12)
      .extent([[0, 0], [chartWidth, chartHeight]])



    // Fix: Ensure D3 Sankey receives the correct node/link structure and types

    // D3 Sankey expects nodes to be objects (can be empty) and links to use node indices.
    // We'll map nodes to empty objects and links to use indices (not undefined).



    // Prepare minimal nodes for D3 Sankey (preserve name property)
    const sankeyNodesInput = nodes.map(node => ({ name: node.name })) as any[];

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
          color: link.color,
          transactionIds: link.transactionIds,
          targetAddress: link.targetAddress || '',
          outputProportion: link.outputProportion || 0
        };
      })
      .filter((l): l is { source: number; target: number; value: number; label: string; color: string; transactionIds: string[]; targetAddress: string; outputProportion: number } => l !== null) as any[];

    // Generate the Sankey layout with better spacing
    const sankeyResult = sankeyGenerator({
      nodes: sankeyNodesInput,
      links: sankeyLinksInput
    }) as any;
    
    const sankeyNodes = sankeyResult.nodes;
    const sankeyLinks = sankeyResult.links;

    // Create the link generator
    const linkGenerator = sankeyLinkHorizontal();

    // Color palette for nodes (muted, sophisticated colors with good contrast)
    const nodeColors = [
      "#E67E22", "#27AE60", "#8E44AD", "#16A085", "#C0392B", 
      "#2C3E50", "#F1C40F", "#7D6608", "#9B59B6", "#1ABC9C",
      "#E74C3C", "#34495E", "#F39C12", "#A04000", "#E59866",
      "#2ECC71", "#8E44AD", "#16A085", "#C0392B", "#2C3E50"
    ]
    
    // Helper function to get node color based on stable entity key
    const getNodeColor = (node: any): string => {
      if (node.name === "Address") {
        return "#8B4513" // Brown for center node (like in the example)
      }
      
      // Use entityGroup (entityKey) for stable color assignment instead of name
      // This ensures colors remain consistent even when display names change
      const stableId = node.entityGroup || node.id || node.name
      const hash = stableId.split('').reduce((a: number, b: string) => {
        a = ((a << 5) - a) + b.charCodeAt(0)
        return a & a
      }, 0)
      return nodeColors[Math.abs(hash) % nodeColors.length]
    }


    // Helper function to calculate node positioning with proper ordering and spacing
    const calculateNodePosition = (d: any): { y0: number; y1: number } => {
      if (d.name === "Address") {
        // Center node - move down 100px from original D3 positioning, set to 150px height
        const originalCenterY = (d.y0 + d.y1) / 2
        const nodeHeight = 150
        return { 
          y0: originalCenterY - (nodeHeight / 2) + 100, 
          y1: originalCenterY + (nodeHeight / 2) + 100 
        }
      }
      
      // Get all nodes of the same type (incoming or outgoing)
        // Identify by actual link relationships instead of just index position
        const centerNodeIndex = sankeyNodes.findIndex((node: any) => node.name === "Address")
        
        // Check if this node has links TO the center (incoming) or FROM the center (outgoing)
        const hasIncomingLinks = sankeyLinks.some((link: any) => 
          link.source.index === d.index && link.target.index === centerNodeIndex
        )
        const hasOutgoingLinks = sankeyLinks.some((link: any) => 
          link.source.index === centerNodeIndex && link.target.index === d.index
        )
        
        const isIncoming = hasIncomingLinks && !hasOutgoingLinks
        const isOutgoing = hasOutgoingLinks && !hasIncomingLinks
        
      
      if (isIncoming || isOutgoing) {
        // Get all nodes of this type and sort by flow amount (largest to smallest)
        const sameTypeNodes = sankeyNodes.filter((node: any) => {
          if (isIncoming) {
            // For incoming nodes, check if they have links TO the center
            return sankeyLinks.some((link: any) => 
              link.source.index === node.index && link.target.index === centerNodeIndex
            )
          }
          if (isOutgoing) {
            // For outgoing nodes, check if they have links FROM the center
            return sankeyLinks.some((link: any) => 
              link.source.index === centerNodeIndex && link.target.index === node.index
            )
          }
          return false
        })
        
        // Calculate flow amounts for each node
        const nodesWithFlows = sameTypeNodes.map((node: any) => {
          let flowAmount = 0
          if (isIncoming) {
            flowAmount = sankeyLinks
              .filter((link: any) => link.source.index === node.index && link.target.index === sankeyNodes.findIndex((n: any) => n.name === "Address"))
              .reduce((sum: number, link: any) => sum + link.value, 0)
          } else if (isOutgoing) {
            flowAmount = sankeyLinks
              .filter((link: any) => link.source.index === sankeyNodes.findIndex((n: any) => n.name === "Address") && link.target.index === node.index)
              .reduce((sum: number, link: any) => sum + link.value, 0)
          }
          
          
          return { node, flowAmount }
        })
        
        // Sort by flow amount (largest to smallest)
        nodesWithFlows.sort((a: any, b: any) => b.flowAmount - a.flowAmount)
        
        // Find this node's position in the sorted list
        const nodeIndex = nodesWithFlows.findIndex((item: any) => item.node.index === d.index)
        
        if (nodeIndex === -1) {
          // Fallback to original positioning
          return { y0: d.y0, y1: d.y1 }
        }
        
        // Calculate total flow for this side
        const totalFlow = nodesWithFlows.reduce((sum: number, n: any) => sum + n.flowAmount, 0)
        
        // Calculate individual node heights (proportional to flow, max 150px per node)
        const nodeHeights = nodesWithFlows.map((item: any) => {
          const proportion = totalFlow > 0 ? item.flowAmount / totalFlow : 0
          // Each node can be up to 150px tall, proportional to its flow
          const calculatedHeight = proportion * 150
          const finalHeight = Math.max(Math.min(calculatedHeight, 150), 10) // Minimum 10px, maximum 150px per node
          
          
          return finalHeight
        })
        
        // Calculate total height needed for all nodes
        const totalNodeHeight = nodeHeights.reduce((sum: number, height: number) => sum + height, 0)
        
        // Calculate spacing between nodes (distribute remaining space evenly)
        const totalSpace = 300 // Total available space
        const remainingSpace = Math.max(0, totalSpace - totalNodeHeight)
        const spacingPerGap = nodesWithFlows.length > 1 ? remainingSpace / (nodesWithFlows.length - 1) : 0
        
        // Calculate cumulative position
        let currentY = 0
        for (let i = 0; i < nodeIndex; i++) {
          currentY += nodeHeights[i] + spacingPerGap
        }
        
        const nodeHeight = nodeHeights[nodeIndex]
        
        
        return {
          y0: currentY,
          y1: currentY + nodeHeight
        }
      }
      
      // Default positioning for other nodes
      return { y0: d.y0, y1: d.y1 }
    }

    // Pre-calculate all node positions to avoid repeated calculations
    const nodePositions = sankeyNodes.map((node: any) => ({
      index: node.index,
      name: node.name,
      position: calculateNodePosition(node)
    }))
    

    // Define gradients for links
    const defs = svg.append("defs")
    
    // Create gradients for each link
    sankeyLinks.forEach((link: any, index: number) => {
      const sourceNode = sankeyNodes[link.source.index]
      const targetNode = sankeyNodes[link.target.index]
          const sourceColor = getNodeColor(sourceNode)
          const targetColor = getNodeColor(targetNode)
      
      const gradient = defs.append("linearGradient")
        .attr("id", `gradient-${index}`)
        .attr("x1", "0%")
        .attr("x2", "100%")
        .attr("y1", "0%")
        .attr("y2", "0%")
      
      gradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", sourceColor)
        .attr("stop-opacity", 0.85)
      
      gradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", targetColor)
        .attr("stop-opacity", 0.85)
    })
    
    // Define arrow markers (small flow arrows)
    const arrowMarker = defs.append("marker")
      .attr("id", "arrowhead")
      .attr("viewBox", "0 0 10 10")
      .attr("refX", 9)
      .attr("refY", 5)
      .attr("markerWidth", 8)
      .attr("markerHeight", 8)
      .attr("orient", "auto")
    
    arrowMarker.append("path")
      .attr("d", "M0,0 L0,10 L10,5 z")
      .attr("fill", "#333")
      .attr("stroke", "#333")
      .attr("stroke-width", 0.5)
      .attr("opacity", 0.7)

    // Add links
    svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`)
      .selectAll("path")
      .data(sankeyLinks)
      .enter()
      .append("path")
        .attr("d", (d: any) => {
          // Use pre-calculated positions for efficiency
          const sourcePosition = nodePositions.find((p: any) => p.index === d.source.index)?.position
          const targetPosition = nodePositions.find((p: any) => p.index === d.target.index)?.position
          
          if (!sourcePosition || !targetPosition) {
            console.warn('Missing node position for link:', d)
            return linkGenerator(d)
          }
          
          
          // Create custom curved paths where height is determined by the target node
          const sourceNode = sankeyNodes[d.source.index]
          const targetNode = sankeyNodes[d.target.index]
          const isCenterNode = (node: any) => node?.name === 'Address'
          
            // Get the actual node positions from D3
            const sourceX1 = d.source.x1
            const targetX0 = d.target.x0
          
          // Calculate the center point for the curve
          const sourceX = sourceX1
          const targetX = targetX0
          const controlPointX = (sourceX + targetX) / 2
          
          let sourceY0, sourceY1, targetY0, targetY1
          
          if (isCenterNode(targetNode)) {
            // Incoming flow: height determined by source node, stack vertically on center node
            sourceY0 = sourcePosition.y0
            sourceY1 = sourcePosition.y1
            const linkHeight = sourceY1 - sourceY0
            
            // Find all incoming links to center node and sort by source node position
            const incomingLinks = sankeyLinks.filter((l: any) => 
              sankeyNodes[l.target.index]?.name === 'Address'
            ).sort((a: any, b: any) => {
              const aPos = nodePositions.find((p: any) => p.index === a.source.index)?.position
              const bPos = nodePositions.find((p: any) => p.index === b.source.index)?.position
              return (aPos?.y0 || 0) - (bPos?.y0 || 0)
            })
            
            // Find this link's position in the sorted list
            const linkIndex = incomingLinks.findIndex((l: any) => 
              l.source.index === d.source.index && l.target.index === d.target.index
            )
            
            // Calculate vertical position on center node - start from top and distribute across full height
            const centerHeight = targetPosition.y1 - targetPosition.y0 // Should be 150px
            const totalLinks = incomingLinks.length
            
            // Distribute links evenly across the full center node height
            const availableHeight = centerHeight
            const totalLinkHeight = incomingLinks.reduce((sum: number, l: any) => {
              const pos = nodePositions.find((p: any) => p.index === l.source.index)?.position
              return sum + (pos ? pos.y1 - pos.y0 : 0)
            }, 0)
            
            const spacing = totalLinks > 1 ? (availableHeight - totalLinkHeight) / (totalLinks - 1) : 0
            let currentY = targetPosition.y0
            
            // Calculate this link's position
            for (let i = 0; i < linkIndex; i++) {
              const otherLink = incomingLinks[i]
              const otherPos = nodePositions.find((p: any) => p.index === otherLink.source.index)?.position
              if (otherPos) {
                currentY += (otherPos.y1 - otherPos.y0) + spacing
              }
            }
            
            targetY0 = currentY
            targetY1 = currentY + linkHeight
          } else if (isCenterNode(sourceNode)) {
            // Outgoing flow: height determined by target node, stack vertically on center node
            targetY0 = targetPosition.y0
            targetY1 = targetPosition.y1
            
            // Find all outgoing links from center node and sort by target node position
            const outgoingLinks = sankeyLinks.filter((l: any) => 
              sankeyNodes[l.source.index]?.name === 'Address'
            ).sort((a: any, b: any) => {
              const aPos = nodePositions.find((p: any) => p.index === a.target.index)?.position
              const bPos = nodePositions.find((p: any) => p.index === b.target.index)?.position
              return (aPos?.y0 || 0) - (bPos?.y0 || 0)
            })
            
            // Find this link's position in the sorted list
            const linkIndex = outgoingLinks.findIndex((l: any) => 
              l.source.index === d.source.index && l.target.index === d.target.index
            )
            
            // Calculate vertical position on center node - start from top and distribute across full height
            const centerHeight = sourcePosition.y1 - sourcePosition.y0 // Should be 150px
            const linkHeight = targetY1 - targetY0
            const totalLinks = outgoingLinks.length
            
            // Distribute links evenly across the full center node height
            const availableHeight = centerHeight
            const totalLinkHeight = outgoingLinks.reduce((sum: number, l: any) => {
              const pos = nodePositions.find((p: any) => p.index === l.target.index)?.position
              return sum + (pos ? pos.y1 - pos.y0 : 0)
            }, 0)
            
            const spacing = totalLinks > 1 ? (availableHeight - totalLinkHeight) / (totalLinks - 1) : 0
            let currentY = sourcePosition.y0
            
            // Calculate this link's position
            for (let i = 0; i < linkIndex; i++) {
              const otherLink = outgoingLinks[i]
              const otherPos = nodePositions.find((p: any) => p.index === otherLink.target.index)?.position
              if (otherPos) {
                currentY += (otherPos.y1 - otherPos.y0) + spacing
              }
            }
            
            sourceY0 = currentY
            sourceY1 = currentY + linkHeight
          } else {
            // Side to side flow (shouldn't happen in our case)
            sourceY0 = sourcePosition.y0
            sourceY1 = sourcePosition.y1
            targetY0 = targetPosition.y0
            targetY1 = targetPosition.y1
          }
          
          // Create a curved path that maintains the height of the target node
          const path = `M${sourceX},${sourceY0} C${controlPointX},${sourceY0} ${controlPointX},${targetY0} ${targetX},${targetY0} L${targetX},${targetY1} C${controlPointX},${targetY1} ${controlPointX},${sourceY1} ${sourceX},${sourceY1} Z`
          
          return path
        })
        .attr("fill", (_: any, i: number) => `url(#gradient-${i})`)
        .attr("opacity", 0.9)
        .attr("marker-end", "url(#arrowhead)")
      .style("cursor", "pointer")
      .style("transition", "all 0.2s ease")
      .on("mouseover", function(_, d: any) {
        // Clean up any existing tooltips first
        d3.selectAll(".sankey-tooltip").remove()
        
        // Highlight the hovered link
        d3.select(this)
          .attr("opacity", 1)
          .style("filter", "drop-shadow(0 0 8px rgba(0, 0, 0, 0.3))")
        
        // Dim other links
        svg.selectAll("path")
          .filter((_, i) => i !== d.index)
          .attr("opacity", 0.2)
      })
      .on("mousemove", function(event, d: any) {
        // Clean up any existing tooltips first
        d3.selectAll(".sankey-tooltip").remove()
        
        // Show tooltip
        const tooltip = d3.select("body").append("div")
          .attr("class", "sankey-tooltip")
          .style("position", "fixed")
          .style("background", theme === 'dark' ? "#374151" : "#ffffff")
          .style("border", `1px solid ${theme === 'dark' ? "#4b5563" : "#d1d5db"}`)
          .style("border-radius", "8px")
          .style("padding", "12px")
          .style("font-size", "14px")
          .style("pointer-events", "none")
          .style("z-index", "1000")
          .style("box-shadow", "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)")
          .style("color", theme === 'dark' ? "#f9fafb" : "#111827")
          .style("font-family", "system-ui, -apple-system, sans-serif")
          .style("max-width", "300px")
          .style("opacity", 0)

        // Get source and target node information using the D3 node indices
        const sourceNode = nodes[d.source.index]
        const targetNode = nodes[d.target.index]
        
        // Resolve proper entity names for the tooltip
        let sourceName = "Unknown"
        let targetName = "Unknown"
        
        // Determine if this is an incoming or outgoing flow
        const isIncoming = sourceNode?.id?.startsWith("In:")
        const isOutgoing = sourceNode?.id === "Address"
        
        if (isIncoming) {
          // Incoming flow: source is external entity, target is central address
          if (sourceNode?.addresses?.[0]) {
            const sourceEntityInfo = getEntityInfo(sourceNode.addresses[0], attributions, itemsMap)
            sourceName = sourceEntityInfo.displayName || sourceNode.addresses[0].slice(0, 6) + "..."
          } else {
            sourceName = sourceNode?.name || "Unknown"
          }
          
          // Target is the central address entity name
          targetName = centralEntityName || "Address"
        } else if (isOutgoing) {
          // Outgoing flow: source is central address, target is external entity
          sourceName = centralEntityName || "Address"
          
          if (targetNode?.addresses?.[0]) {
            // Use the first address to get proper entity info
            const targetAddress = targetNode.addresses[0]
            const targetEntityInfo = getEntityInfo(targetAddress, attributions, itemsMap)
            targetName = targetEntityInfo.displayName || targetAddress.slice(0, 6) + "..."
          } else if (targetNode?.entityGroup) {
            // If no addresses but has entityGroup, try to find an address for this entity
            const targetAddress = d.targetAddress || targetNode.entityGroup
            const targetEntityInfo = getEntityInfo(targetAddress, attributions, itemsMap)
            targetName = targetEntityInfo.displayName || targetAddress.slice(0, 6) + "..."
          } else {
            targetName = targetNode?.name || "Unknown"
          }
        } else {
          // Fallback - use node names as-is
          sourceName = sourceNode?.name?.replace(/In: |Out: /g, "") || "Unknown"
          targetName = targetNode?.name?.replace(/In: |Out: /g, "") || "Unknown"
        }
        
        // Create the improved tooltip label with appropriate counts
        
        let countText = ""
        if (isIncoming) {
          // For incoming flows, show transaction count
          const txCount = d.transactionIds?.length || 0
          countText = ` (${txCount} tx${txCount !== 1 ? 's' : ''})`
        } else if (isOutgoing) {
          // For outgoing flows, show transaction count for aggregated flows
          const txCount = d.transactionIds?.length || 0
          countText = ` (${txCount} tx${txCount !== 1 ? 's' : ''})`
        } else {
          // Fallback to transaction count
          countText = ` (${d.transactionIds?.length || 0} txs)`
        }
        
        const tooltipLabel = `${sourceName} → ${targetName}: ${formatCurrency(d.value)}${countText}`

        tooltip.html(`
          <div style="font-weight: 600; margin-bottom: 4px;">${tooltipLabel}</div>
          <div style="font-size: 12px; color: ${theme === 'dark' ? '#9ca3af' : '#6b7280'};">Click for detailed transaction flow information</div>
        `)
        
        const mouseX = event.clientX || event.pageX || 0
        const mouseY = event.clientY || event.pageY || 0
        
        tooltip
          .style("left", (mouseX + 15) + "px")
          .style("top", (mouseY - 10) + "px")
          .transition()
          .duration(150)
          .style("opacity", 1)
      })
      .on("click", function(_: any, d: any) {
        // Get source and target node information using the D3 node indices
        const sourceNode = nodes[d.source.index]
        const targetNode = nodes[d.target.index]
        
        if (sourceNode && targetNode) {
          // Get proper entity information for source using Risk Dashboard logic
          let sourceName = sourceNode.name.replace(/In: |Out: /g, "")
          let sourceEntityType = sourceNode.entityType || "Unknown"
          
          if (sourceNode.addresses?.[0]) {
            // For incoming flows, source node has addresses
            const sourceAddress = sourceNode.addresses[0]
            const sourceEntityInfo = getEntityInfo(sourceAddress, attributions, itemsMap)
            sourceName = sourceEntityInfo.displayName || sourceAddress.slice(0, 6) + "..."
            sourceEntityType = sourceEntityInfo.entityType
          } else if (sourceNode.id === "Address") {
            // For outgoing flows, source is the central address - use proper entity name
            sourceName = centralEntityName
            sourceEntityType = centralEntityInfo.entityType || "Address"
          }
          
          // Get proper entity information for target using Risk Dashboard logic
          let targetName = targetNode.name.replace(/In: |Out: /g, "")
          let targetEntityType = targetNode.entityType || "Unknown"
          let targetAddress = ""
          let targetAttribution = undefined
          
          if (targetNode.addresses?.[0]) {
            // For outgoing flows, target node has addresses - use the first address
            targetAddress = targetNode.addresses[0]
            targetAttribution = attributions[targetAddress]
            const targetEntityInfo = getEntityInfo(targetAddress, attributions, itemsMap)
            
            targetName = targetEntityInfo.displayName || targetAddress.slice(0, 6) + "..."
            targetEntityType = targetEntityInfo.entityType
          } else if (targetNode.entityGroup) {
            // If no addresses but has entityGroup, try to find an address for this entity
            targetAddress = d.targetAddress || targetNode.entityGroup
            targetAttribution = attributions[targetAddress]
            const targetEntityInfo = getEntityInfo(targetAddress, attributions, itemsMap)
            
            targetName = targetEntityInfo.displayName || targetAddress.slice(0, 6) + "..."
            targetEntityType = targetEntityInfo.entityType
          } else if (targetNode.id === "Address") {
            // For incoming flows, target is the central address - use the actual address
            targetAddress = address
            targetAttribution = attributions[address]
            const targetEntityInfo = getEntityInfo(address, attributions, itemsMap)
            
            
            targetName = targetEntityInfo.displayName || centralEntityName
            targetEntityType = targetEntityInfo.entityType || "Address"
          }
          
          // Determine the correct source address for the modal
          let sourceAddress = ""
          let sourceAttribution = undefined
          
          if (sourceNode.addresses?.[0]) {
            // For incoming flows, source node has addresses
            sourceAddress = sourceNode.addresses[0]
            sourceAttribution = attributions[sourceAddress]
          } else if (sourceNode.id === "Address") {
            // For outgoing flows, source is the central address
            sourceAddress = address
            sourceAttribution = attributions[address]
          }
          
          // Check if this is an aggregated edge (multiple transactions)
          const isAggregated = d.transactionIds && d.transactionIds.length > 1
          const transactionCount = d.transactionIds?.length || 0
          
          const linkModalData: LinkModalData = {
            sourceName,
            targetName,
            sourceAddress: sourceAddress,
            targetAddress: targetAddress,
            value: d.value,
            sourceEntityType,
            targetEntityType,
            sourceAttribution: sourceAttribution,
            targetAttribution: targetAttribution,
            transactionId: isAggregated ? undefined : (d.transactionIds?.[0] || ""),
            transactionCount: isAggregated ? transactionCount : undefined,
            inputAddresses: sourceNode.addresses || [],
            outputAddresses: targetNode.addresses || []
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
        
        // Remove tooltip immediately
        d3.selectAll(".sankey-tooltip").remove()
      })

    // Add nodes
    const nodeGroup = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`)
      .selectAll("g")
      .data(sankeyNodes)
      .enter()
      .append("g")
      .attr("transform", (d: any) => {
        // Use pre-calculated positions for consistency
        const nodePosition = nodePositions.find((p: any) => p.index === d.index)
        if (nodePosition) {
          return `translate(${d.x0},${nodePosition.position.y0})`
        }
        return `translate(${d.x0},${d.y0})`
      })

    // Add node rectangles
    nodeGroup.append("rect")
      .attr("height", (d: any) => {
        // Use pre-calculated positions for consistency
        const nodePosition = nodePositions.find((p: any) => p.index === d.index)
        if (nodePosition) {
          const newHeight = nodePosition.position.y1 - nodePosition.position.y0
          return newHeight
        }
        
        return d.y1 - d.y0
      })
      .attr("width", (d: any) => {
        const baseWidth = d.x1 - d.x0
        
        if (d.name === "Address") {
          // Central address node - keep minimum width
          return Math.max(baseWidth, 30)
        } else if (d.name && d.name.startsWith("Out:")) {
          // Target nodes for outgoing flows - make width proportional to flow percentage
          // Find the corresponding link to get the proportion
          const outgoingLink = sankeyLinks.find((link: any) => 
            link.target.index === d.index && link.source.index === nodes.findIndex(n => n.id === "Address")
          )
          
          if (outgoingLink && outgoingLink.outputProportion) {
            // Calculate proportional width based on flow percentage
            // Use a minimum width of 15px and maximum of baseWidth
            const minWidth = 15
            const maxWidth = baseWidth
            const proportionalWidth = Math.max(minWidth, baseWidth * outgoingLink.outputProportion)
            return Math.min(proportionalWidth, maxWidth)
          }
        }
        
        // Default width for other nodes
        return baseWidth
      })
        .attr("fill", (d: any) => getNodeColor(d))
      .attr("opacity", 0.95)
      .attr("rx", 4)
      .attr("ry", 4)
      .attr("stroke", (d: any) => d.name === "Address" ? "#E67E22" : "#2C3E50")
      .attr("stroke-width", (d: any) => d.name === "Address" ? 2 : 1)
      .style("cursor", (d: any) => d.name !== "Address" ? "pointer" : "default")
      .style("filter", "drop-shadow(0 2px 4px rgba(0,0,0,0.1))")

      .on("mouseover", function() {
        // Clean up any existing tooltips first
        d3.selectAll(".sankey-tooltip").remove()
        
        d3.select(this).attr("opacity", 1)
      })
      .on("mousemove", function(event, d: any) {
        // Clean up any existing tooltips first
        d3.selectAll(".sankey-tooltip").remove()
        
        // Show tooltip
        const tooltip = d3.select("body").append("div")
          .attr("class", "sankey-tooltip")
          .style("position", "fixed")
          .style("background", theme === 'dark' ? "#374151" : "#ffffff")
          .style("border", `1px solid ${theme === 'dark' ? "#4b5563" : "#d1d5db"}`)
          .style("border-radius", "8px")
          .style("padding", "12px")
          .style("font-size", "14px")
          .style("pointer-events", "none")
          .style("z-index", "1000")
          .style("box-shadow", "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)")
          .style("color", theme === 'dark' ? "#f9fafb" : "#111827")
          .style("font-family", "system-ui, -apple-system, sans-serif")
          .style("max-width", "300px")
          .style("opacity", 0)

        // Get the original node data using the D3 node index
        const originalNode = nodes[d.index]
        let displayName = (d.name || "").replace(/In: |Out: /g, "")
        const addresses = d.addresses || []
        
        // Use proper entity resolution for the center address node
        if (originalNode && originalNode.name === "Address") {
          // Use centralEntityName directly since it's already calculated with proper fallbacks
          displayName = centralEntityName || "Address"
        } else if (originalNode && originalNode.addresses?.[0]) {
          // For other nodes with addresses, use proper entity resolution
          const entityInfo = getEntityInfo(originalNode.addresses[0], attributions, itemsMap)
          displayName = entityInfo.displayName || displayName
        }
        
        tooltip.html(`
          <div style="font-weight: 600; margin-bottom: 4px;">${displayName}</div>
          ${addresses.length > 0 ? `<div style="font-size: 12px; color: ${theme === 'dark' ? '#9ca3af' : '#6b7280'}; font-family: monospace;">${addresses.length} address${addresses.length > 1 ? 'es' : ''}</div>` : ''}
          <div style="font-size: 12px; color: ${theme === 'dark' ? '#9ca3af' : '#6b7280'}; margin-top: 4px;">Click for entity details</div>
        `)
        
        const mouseX = event.clientX || event.pageX || 0
        const mouseY = event.clientY || event.pageY || 0
        
        tooltip
          .style("left", (mouseX + 15) + "px")
          .style("top", (mouseY - 10) + "px")
          .transition()
          .duration(150)
          .style("opacity", 1)
      })
      .on("mouseout", function() {
        d3.select(this).attr("opacity", 0.95)
        // Remove tooltip immediately
        d3.selectAll(".sankey-tooltip").remove()
      })
      .on("click", function(_: any, d: any) {
        // Get the original node data using the D3 node index
        const originalNode = nodes[d.index]
        
        if (originalNode && originalNode.name === "Address") {
          // Handle center wallet node - calculate flow data from the actual Sankey links
          // Calculate total incoming from all links where this node is the target
          const incomingLinks = links.filter(link => link.target === "Address")
          const totalIncoming = incomingLinks.reduce((sum, link) => sum + link.value, 0)
          
          // Calculate total outgoing from all links where this node is the source
          const outgoingLinks = links.filter(link => link.source === "Address")
          const totalOutgoing = outgoingLinks.reduce((sum, link) => sum + link.value, 0)
          
          
          const netFlow = totalIncoming - totalOutgoing
          
          console.log('🔍 Flow calculation debug:', {
            totalIncomingSatoshis: totalIncoming,
            totalOutgoingSatoshis: totalOutgoing,
            netFlowSatoshis: netFlow,
            totalIncomingBTC: totalIncoming / 100000000,
            totalOutgoingBTC: totalOutgoing / 100000000,
            netFlowBTC: netFlow / 100000000
          })
          
          const centerWalletModalData: CenterWalletModalData = {
            address: address,
            totalIncoming, // Keep in satoshis - formatCurrency will convert
            totalOutgoing, // Keep in satoshis - formatCurrency will convert
            netFlow, // Keep in satoshis - formatCurrency will convert
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

    // Add entity logos to nodes (images and emojis)
    console.log('🎨 Adding logos to D3 nodes, current nodeLogos:', nodeLogos)
    
    // Add image logos for regular entities
    nodeGroup.append("image")
      .attr("x", (d: any) => {
        const baseWidth = d.x1 - d.x0
        const logoSize = Math.min(20, baseWidth - 4) // Logo size, max 20px, with 2px padding
        return (baseWidth - logoSize) / 2 // Center horizontally within the node
      })
      .attr("y", (d: any) => {
        const nodePosition = nodePositions.find((p: any) => p.index === d.index)
        const nodeHeight = nodePosition ? nodePosition.position.y1 - nodePosition.position.y0 : d.y1 - d.y0
        const logoSize = Math.min(20, nodeHeight - 4) // Logo size, max 20px, with 2px padding
        return (nodeHeight - logoSize) / 2 // Center vertically within the node
      })
      .attr("width", (d: any) => {
        const baseWidth = d.x1 - d.x0
        return Math.min(20, baseWidth - 4) // Logo size, max 20px, with 2px padding
      })
      .attr("height", (d: any) => {
        const nodePosition = nodePositions.find((p: any) => p.index === d.index)
        const nodeHeight = nodePosition ? nodePosition.position.y1 - nodePosition.position.y0 : d.y1 - d.y0
        return Math.min(20, nodeHeight - 4) // Logo size, max 20px, with 2px padding
      })
      .attr("href", (d: any) => {
        // Get the original node data to find the entity ID
        const originalNode = nodes[d.index]
        if (originalNode && originalNode.type === 'entity' && originalNode.entityGroup) {
          const logoUrl = nodeLogos[originalNode.id] || ''
          // Only show image if it's a URL (not an emoji)
          const isImageUrl = logoUrl && logoUrl.startsWith('http')
          console.log('🎨 Setting image logo for node', originalNode.id, 'entity', originalNode.entityGroup, 'logoUrl:', logoUrl, 'isImageUrl:', isImageUrl)
          return isImageUrl ? logoUrl : ''
        }
        return ''
      })
      .attr("opacity", (d: any) => {
        // Only show image if it's a URL (not an emoji)
        const originalNode = nodes[d.index]
        if (originalNode && originalNode.type === 'entity' && originalNode.entityGroup) {
          const logoUrl = nodeLogos[originalNode.id] || ''
          const isImageUrl = logoUrl && logoUrl.startsWith('http')
          const hasLogo = !!logoUrl && isImageUrl
          console.log('🎨 Image logo opacity for node', originalNode.id, ':', hasLogo ? 1 : 0)
          return hasLogo ? 1 : 0
        }
        return 0
      })
      .style("pointer-events", "none") // Don't interfere with node clicks
      .on("error", function() {
        // Hide logo if it fails to load
        console.log('🎨 Image logo failed to load, hiding')
        d3.select(this).attr("opacity", 0)
      })

    // Add emoji logos for special entities (like mining rewards)
    nodeGroup.append("text")
      .attr("x", (d: any) => {
        const baseWidth = d.x1 - d.x0
        return baseWidth / 2 // Center horizontally within the node
      })
      .attr("y", (d: any) => {
        const nodePosition = nodePositions.find((p: any) => p.index === d.index)
        const nodeHeight = nodePosition ? nodePosition.position.y1 - nodePosition.position.y0 : d.y1 - d.y0
        return nodeHeight / 2 + 6 // Center vertically within the node (6px offset for text baseline)
      })
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .attr("font-size", "16px")
      .text((d: any) => {
        // Get the original node data to find the entity ID
        const originalNode = nodes[d.index]
        if (originalNode && originalNode.type === 'entity' && originalNode.entityGroup) {
          const logoUrl = nodeLogos[originalNode.id] || ''
          // Only show emoji if it's not a URL (i.e., it's an emoji)
          const isEmoji = logoUrl && !logoUrl.startsWith('http')
          console.log('🎨 Setting emoji logo for node', originalNode.id, 'entity', originalNode.entityGroup, 'logoUrl:', logoUrl, 'isEmoji:', isEmoji)
          return isEmoji ? logoUrl : ''
        }
        return ''
      })
      .attr("opacity", (d: any) => {
        // Only show emoji if it's not a URL
        const originalNode = nodes[d.index]
        if (originalNode && originalNode.type === 'entity' && originalNode.entityGroup) {
          const logoUrl = nodeLogos[originalNode.id] || ''
          const isEmoji = logoUrl && !logoUrl.startsWith('http')
          const hasLogo = !!logoUrl && isEmoji
          console.log('🎨 Emoji logo opacity for node', originalNode.id, ':', hasLogo ? 1 : 0)
          return hasLogo ? 1 : 0
        }
        return 0
      })
      .style("pointer-events", "none") // Don't interfere with node clicks


    // Add node labels (entity names only)
    nodeGroup.append("text")
      .attr("x", (d: any) => d.x0 < chartWidth / 2 ? -25 : 45)
      .attr("y", (d: any) => (d.y1 - d.y0) / 2 + 5)
      .attr("text-anchor", (d: any) => d.x0 < chartWidth / 2 ? "end" : "start")
      .attr("fill", theme === 'dark' ? "#ffffff" : "#000000")
      .attr("font-size", "12px")
      .style("dominant-baseline", "middle")
      .text((d: any) => {
        if (!d.name) return ""
        if (d.name === "Address") return "" // Don't show text on the center node itself
        if (d.name.startsWith("In:") || d.name.startsWith("Out:")) {
          // Extract just the entity name part
          const parts = d.name.split(": ")
          return parts.length > 1 ? parts[1] : d.name
        }
        return d.name
      })

    // Add centered label above the center node
    let centerNode = sankeyNodes.find((node: any) => node.id === "Address" || node.name === "Address")
    
    // Fallback: find the center node by looking for the one in the middle (usually the center node)
    if (!centerNode && sankeyNodes.length > 0) {
      centerNode = sankeyNodes[Math.floor(sankeyNodes.length / 2)]
    }
    
    
    if (centerNode) {
      // Get the calculated position for the center node
      const centerNodePosition = nodePositions.find((p: any) => p.index === centerNode.index)
      const actualY0 = centerNodePosition ? centerNodePosition.position.y0 : centerNode.y0
      
      // Add the entity name label directly to the SVG
      svg.append("text")
        .attr("x", margin.left + centerNode.x0 + (centerNode.x1 - centerNode.x0) / 2)
        .attr("y", margin.top + actualY0 - 25)
        .attr("text-anchor", "middle")
        .attr("fill", theme === 'dark' ? "#ffffff" : "#000000")
        .attr("font-size", "14px")
        .attr("font-weight", "bold")
        .text(centralEntityName)
        .style("pointer-events", "none") // Prevent interference with mouse events
        .style("z-index", "10") // Ensure it's on top
    }



  }, [nodes, links, theme, centralEntityName])


  return (
    <>
      <h4 className={`text-xl font-semibold mb-6 ${
        theme === 'dark' ? 'text-white' : 'text-gray-900'
      }`}>Address Flow Analysis (Entity Aggregated)</h4>
      <p className={`text-sm mb-4 ${
        theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
      }`}>
        Showing Bitcoin (BTC) flow amounts for {displayedIncomingEntities} of {totalIncomingEntities} input entities from {totalInputTransactions} transactions and {displayedOutgoingEntities} of {totalOutgoingEntities} output entities from {totalOutputTransactions} transactions.
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
                width={1400}
                height={350}
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
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="w-full max-w-2xl mx-4 bg-background border rounded-lg shadow-lg">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">
                {linkModalData.sourceName} → {linkModalData.targetName}
              </h3>
              <button
                onClick={() => setIsLinkModalOpen(false)}
                className="p-1 rounded-sm opacity-70 hover:opacity-100"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              {/* Amount and Types */}
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-green-600">
                  {formatCurrency(linkModalData.value)}
                </span>
                <div className="text-sm text-muted-foreground">
                  {linkModalData.sourceEntityType} → {linkModalData.targetEntityType}
                </div>
              </div>

              {/* Transaction ID */}
              {linkModalData.transactionId && (
                  <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Transaction ID</div>
                  <div 
                    className="p-2 rounded font-mono text-sm bg-muted border cursor-pointer hover:bg-muted/80 transition-colors"
                    onClick={() => copyToClipboard(linkModalData.transactionId!)}
                    title="Click to copy"
                  >
                    {linkModalData.transactionId}
                    </div>
                  </div>
                )}

              {/* Transaction Count for Aggregated Edges */}
              {linkModalData.transactionCount && (
                  <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Transactions</div>
                  <div className="p-2 rounded text-sm bg-muted border">
                    {linkModalData.transactionCount} Transactions
                  </div>
                  </div>
                )}

              {/* Entities and Addresses */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">From</div>
                  <div className="p-2 rounded text-sm bg-muted border">
                    {linkModalData.sourceName}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground font-mono">
                    {linkModalData.sourceAddress || 'Unknown address'}
                  </div>
                  {linkModalData.sourceAttribution?.entity && (
                    <div className="mt-1 text-xs text-blue-600 font-mono">
                      Entity: {linkModalData.sourceAttribution.entity}
                  </div>
                )}
                  {linkModalData.sourceAttribution?.cospend_id && !linkModalData.sourceAttribution?.entity && (
                    <div className="mt-1 text-xs text-blue-600 font-mono">
                      Cospend: {linkModalData.sourceAttribution.cospend_id}
                          </div>
                        )}
                  {linkModalData.inputAddresses && linkModalData.inputAddresses.length > 1 && (
                    <div className="mt-1 text-xs text-muted-foreground">
                      +{linkModalData.inputAddresses.length - 1} more input{linkModalData.inputAddresses.length - 1 > 1 ? 's' : ''}
                          </div>
                        )}
                      </div>

                    <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">To</div>
                  <div className="p-2 rounded text-sm bg-muted border">
                    {linkModalData.targetName}
                          </div>
                  <div className="mt-1 text-xs text-muted-foreground font-mono">
                    {linkModalData.targetAddress || 'Unknown address'}
                  </div>
                  {linkModalData.targetAttribution?.entity && (
                    <div className="mt-1 text-xs text-blue-600 font-mono">
                      Entity: {linkModalData.targetAttribution.entity}
                          </div>
                        )}
                  {linkModalData.targetAttribution?.cospend_id && !linkModalData.targetAttribution?.entity && (
                    <div className="mt-1 text-xs text-blue-600 font-mono">
                      Cospend: {linkModalData.targetAttribution.cospend_id}
                    </div>
                  )}
                  {linkModalData.outputAddresses && linkModalData.outputAddresses.length > 1 && (
                    <div className="mt-1 text-xs text-muted-foreground">
                      +{linkModalData.outputAddresses.length - 1} more output{linkModalData.outputAddresses.length - 1 > 1 ? 's' : ''}
                </div>
              )}
                </div>
            </div>
            
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
                    }`}>Balance:</span>
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
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  theme === 'dark' 
                    ? 'bg-orange-500 hover:bg-orange-600 text-white' 
                    : 'bg-orange-500 hover:bg-orange-600 text-white'
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
  } catch (error) {
    console.error('SimpleSankeyTest error:', error)
    return (
      <div className="p-6 bg-red-100 border border-red-400 text-red-700 rounded">
        <h4 className="text-xl font-semibold mb-2">Error in Sankey Component</h4>
        <p>There was an error rendering the Sankey diagram: {error instanceof Error ? error.message : 'Unknown error'}</p>
        <details className="mt-2">
          <summary className="cursor-pointer">Show details</summary>
          <pre className="mt-2 text-xs bg-red-50 p-2 rounded overflow-auto">
            {error instanceof Error ? error.stack : JSON.stringify(error)}
          </pre>
        </details>
      </div>
    )
  }
} 