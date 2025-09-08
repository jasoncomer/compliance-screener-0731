import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { nanoid } from 'nanoid'

export interface FTConnection {
  from: string
  to: string
  amount: string
  note?: string
  currency: string
  date?: string
  direction: 'in' | 'out'
  hideTxId?: boolean
  txHash?: string
  id?: string
  customColor?: string
  isAggregated?: boolean
  utxoCount?: number
  originalConnections?: FTConnection[]
  groupId?: string
}

export interface FTNode {
  id: string
  label: string
  type: string
  logoUrl?: string
  address?: string
  x?: number
  y?: number
  risk?: number
  entityId?: string
  entityType?: string
  bo?: string
  custodian?: string
}

interface GraphState {
  nodes: FTNode[]
  connections: FTConnection[]
  selectedNodeId: string | null
  selectedEdgeId: string | null

  // Node actions
  addNode: (node: FTNode) => void
  updateNode: (id: string, updates: Partial<FTNode>) => void
  deleteNode: (id: string) => void
  setSelectedNode: (id: string | null) => void

  // Connection actions
  addConnection: (connection: Omit<FTConnection, 'id'>) => void
  updateConnection: (txHash: string, updates: Partial<FTConnection>) => void
  deleteConnection: (txHash: string) => void
  setSelectedEdge: (id: string | null) => void

  // Batch actions
  clearAll: () => void
  loadState: (state: { nodes: FTNode[]; connections: FTConnection[] }) => void
}

export const useFlowTraceStore = create<GraphState>()(
  persist<GraphState>(
    (set: (fn: (state: GraphState) => Partial<GraphState> | GraphState) => void, get: () => GraphState) => ({
      nodes: [],
      connections: [],
      selectedNodeId: null,
      selectedEdgeId: null,

      // Node actions
      addNode: (node: FTNode) =>
        set((state: GraphState) => ({
          nodes: [...state.nodes, { ...node, id: node.id || nanoid() }],
        })),

      updateNode: (id: string, updates: Partial<FTNode>) =>
        set((state: GraphState) => ({
          nodes: state.nodes.map((node: FTNode) =>
            node.id === id ? { ...node, ...updates } : node
          ),
        })),

      deleteNode: (id: string) =>
        set((state: GraphState) => ({
          nodes: state.nodes.filter((node: FTNode) => node.id !== id),
          connections: state.connections.filter(
            (conn: FTConnection) => conn.from !== id && conn.to !== id
          ),
        })),

      setSelectedNode: (id) => set({ selectedNodeId: id }),

      // Connection actions
      addConnection: (connection: Omit<FTConnection, 'id'>) =>
        set((state: GraphState) => ({
          connections: [
            ...state.connections,
            {
              ...connection,
              id: nanoid(),
              txHash: connection.txHash || `tx_${nanoid()}`,
            },
          ],
        })),

      updateConnection: (txHash: string, updates: Partial<FTConnection>) =>
        set((state: GraphState) => ({
          connections: state.connections.map((conn: FTConnection) =>
            conn.txHash === txHash ? { ...conn, ...updates } : conn
          ),
        })),

      deleteConnection: (txHash: string) =>
        set((state: GraphState) => ({
          connections: state.connections.filter((conn: FTConnection) => conn.txHash !== txHash),
        })),

      setSelectedEdge: (id) => set({ selectedEdgeId: id }),

      // Batch actions
      clearAll: () =>
        set({
          nodes: [],
          connections: [],
          selectedNodeId: null,
          selectedEdgeId: null,
        }),

      loadState: (state) =>
        set({
          nodes: state.nodes,
          connections: state.connections,
        }),
    }),
    {
      name: 'flowtrace-graph-storage',
      partialize: (state) => ({
        nodes: state.nodes,
        connections: state.connections,
      }),
    }
  )
)