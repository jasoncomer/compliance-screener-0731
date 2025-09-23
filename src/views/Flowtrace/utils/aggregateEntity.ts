import { connectionInvolvesAddress, generateConnectionKey } from './utxoKeyGeneration'

export type FTNode = {
  id: string
  x: number
  y: number
  label?: string
  entityId?: string
  entityType?: string
  logoUrl?: string
  balance?: number | string
  risk?: number | string
}

export interface FTConnection {
  from: string
  to: string
  amount: string
  currency: string
  txHash?: string
  type?: 'in' | 'out'
}

export interface GraphState {
  nodes: FTNode[]
  edges: FTConnection[]
}

export interface AggregationResult {
  newState: GraphState
  undo: {
    nodes: FTNode[]
    edges: FTConnection[]
    allMemberConnections?: FTConnection[]
  }
}

/*
  Collapse all nodes whose id is in memberIds into a new aggregate node (id = agg:<entityKey>).
  - Drops intra-cluster edges
  - Rewrites endpoints of external edges to the new node
  - Sums amounts of duplicate edges (same from,to,currency,txHash optional)
*/
export function aggregateEntity(
  state: GraphState,
  entityKey: string,
  memberIds: string[],
): AggregationResult {
  const memberSet = new Set(memberIds)
  const aggId = `agg:${entityKey.replace(/\s+/g, '_')}`

  // build new node using centroid of members
  const members = state.nodes.filter((n) => memberSet.has(n.id))
  const avgX = members.reduce((s, n) => s + n.x, 0) / members.length || 0
  const avgY = members.reduce((s, n) => s + n.y, 0) / members.length || 0
  const primary = members[0]
  
  // Calculate total UTXO value from all member nodes by looking at connections
  const calculateNodeUtxoValue = (nodeId: string): number => {
    let totalValue = 0
    
    state.edges.forEach(conn => {
      // If this is an aggregated connection, use the original connections for UTXO value
      const connectionsToUse = (conn as any).originalConnections || [conn]
      
      connectionsToUse.forEach((originalConn: any) => {
        // Use connection key approach for matching
        if (connectionInvolvesAddress(originalConn, nodeId)) {
          totalValue += parseFloat(originalConn.amount) || 0
        }
      })
    })
    
    return totalValue
  }
  
  const totalUtxoValue = members.reduce((sum, n) => {
    return sum + calculateNodeUtxoValue(n.id)
  }, 0)
  
  // Calculate average risk score from all member nodes
  const averageRisk = members.reduce((sum, n) => {
    const risk = typeof n.risk === 'number' ? n.risk : (typeof n.risk === 'string' ? parseFloat(n.risk) : 0);
    return sum + (isNaN(risk) ? 0 : risk);
  }, 0) / members.length;
  
  const aggNode: FTNode = {
    id: aggId,
    x: avgX,
    y: avgY,
    label: entityKey,
    entityType: primary?.entityType,
    logoUrl: primary?.logoUrl,
    balance: totalUtxoValue, // Set the total UTXO value in satoshis
    risk: Math.round(averageRisk), // Set the average risk score
  }

  // rewrite edges
  const map = new Map<string, FTConnection>()
  const originals: FTConnection[] = []

  const edgeKey = (e: FTConnection) => `${e.from}-${e.to}-${e.currency}`

  state.edges.forEach((e) => {
    const fromIn = memberSet.has(e.from)
    const toIn = memberSet.has(e.to)

    if (fromIn && toIn) {
      // intra, drop but keep original for undo
      originals.push(e)
      return
    }

    const mod: FTConnection = { ...e }
    if (fromIn) mod.from = aggId
    if (toIn) mod.to = aggId
    if (fromIn || toIn) originals.push(e);

    // Generate connectionKey for the modified connection
    (mod as any).connectionKey = generateConnectionKey(mod)

    const k = edgeKey(mod)
    if (map.has(k)) {
      const ex = map.get(k)!
      const a = parseFloat(ex.amount) || 0
      const b = parseFloat(mod.amount) || 0
      ex.amount = String(a + b);
      // Regenerate connectionKey after amount change
      (ex as any).connectionKey = generateConnectionKey(ex)
    } else {
      map.set(k, mod)
    }
  })

  // Store all connections that involve any of the member nodes for the aggregated node dialog
  const allMemberConnections: FTConnection[] = []
  state.edges.forEach((e) => {
    // Use connection key approach to check if connection involves any member
    const involvesMember = memberIds.some(memberId => connectionInvolvesAddress(e, memberId))
    if (involvesMember) {
      allMemberConnections.push(e)
    }
  })

  const newEdges = Array.from(map.values())
  const newNodes = state.nodes.filter((n) => !memberSet.has(n.id))
  newNodes.push(aggNode)

  return {
    newState: { nodes: newNodes, edges: newEdges },
    undo: { nodes: members, edges: originals, allMemberConnections },
  }
}