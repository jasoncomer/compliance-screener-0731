// import * as diff from 'json-diff' // Unused for now
import { DBSchema, IDBPDatabase,openDB } from 'idb'
import { v4 as uuid } from 'uuid'

// Database schema for IndexedDB
interface WorkspaceDB extends DBSchema {
  workspaces: {
    key: string
    value: Workspace
  }
  versions: {
    key: string
    value: WorkspaceVersion & { workspaceId: string }
    indexes: { 'by-workspace': string }
  }
}

export interface WorkspaceVersion {
  id: string
  name: string
  description?: string
  timestamp: string
  graphState: {
    viewport: { x: number; y: number; zoom: number }
    nodes: any[]
    edges: any[]
    selectedAddress?: string
    selectedNode?: any
    hidePassThrough: boolean
    customNodes: any[]
    nodeStyles: Record<string, any>
    connectionStyles: Record<string, any>
    drawingElements?: any[]
    selectedElements?: string[]
    filters?: any
    settings?: any
  }
  saveType: 'auto' | 'quick' | 'manual'
  diff: string
}

export interface Workspace {
  id: string
  name: string
  description?: string
  masterVersionId: string | null
  versions: WorkspaceVersion[]
  autoSaveInterval: number
  createdAt: string
  updatedAt: string
}

// Singleton DB instance
let db: IDBPDatabase<WorkspaceDB> | null = null

// -----------------------
// IndexedDB helpers
// -----------------------
const initDB = async () => {
  if (db) return db

  db = await openDB<WorkspaceDB>('blockscout-workspaces', 1, {
    upgrade(db) {
      db.createObjectStore('workspaces', { keyPath: 'id' })
      const versionStore = db.createObjectStore('versions', { keyPath: 'id' })
      versionStore.createIndex('by-workspace', 'workspaceId')
    },
  })

  return db
}

// --- CRUD HELPERS (ported verbatim from Flowtrace) ---

// Save workspace to IndexedDB
const saveWorkspaceToDB = async (workspace: Workspace) => {
  const database = await initDB()
  await database.put('workspaces', workspace)
  for (const version of workspace.versions) {
    await database.put('versions', { ...version, workspaceId: workspace.id } as any)
  }
}

const deleteWorkspaceFromDB = async (workspaceId: string) => {
  const database = await initDB()
  await database.delete('workspaces', workspaceId)
  const versions = await database.getAllFromIndex('versions', 'by-workspace', workspaceId)
  for (const version of versions) {
    await database.delete('versions', version.id)
  }
}

export const getAllWorkspaces = async (): Promise<Workspace[]> => {
  const database = await initDB()
  const workspaces = await database.getAll('workspaces')
  return (workspaces || []).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
}

export const getWorkspace = async (workspaceId: string): Promise<Workspace | null> => {
  const database = await initDB()
  return (await database.get('workspaces', workspaceId)) || null
}

// --- SERIALISATION HELPERS ---
const serializeGraphState = (graphState: any) => ({
  viewport: {
    x: graphState.pan?.x || 0,
    y: graphState.pan?.y || 0,
    zoom: graphState.zoom || 1,
  },
  nodes: (graphState.nodes || []).map((n: any) => ({ ...n, position: { ...n.position }, data: { ...n.data }, style: { ...n.style } })),
  edges: (graphState.edges || []).map((e: any) => ({ ...e, style: { ...e.style }, data: { ...e.data } })),
  selectedAddress: graphState.selectedAddress,
  selectedNode: graphState.selectedNode,
  hidePassThrough: graphState.hidePassThrough,
  customNodes: graphState.customNodes || [],
  nodeStyles: graphState.nodeStyles || {},
  connectionStyles: graphState.connectionStyles || {},
  drawingElements: graphState.drawingElements || [],
  selectedElements: graphState.selectedElements || [],
  filters: graphState.filters || {},
  settings: graphState.settings || {},
})

// Create workspace
export const createWorkspace = async (graphState: any, name: string, description = ''): Promise<Workspace> => {
  const masterVersion: WorkspaceVersion = {
    id: uuid(),
    name: 'Master',
    description,
    timestamp: new Date().toISOString(),
    graphState: serializeGraphState(graphState),
    saveType: 'manual',
    diff: 'Initial version',
  }

  const workspace: Workspace = {
    id: uuid(),
    name,
    description,
    masterVersionId: masterVersion.id,
    versions: [masterVersion],
    autoSaveInterval: 5 * 60 * 1000,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  await saveWorkspaceToDB(workspace)
  return workspace
}

// Update / quick-save master version
export const updateMasterVersion = async (workspaceId: string, graphState: any, saveType: 'auto' | 'quick' | 'manual' = 'quick') => {
  const workspace = await getWorkspace(workspaceId)
  if (!workspace) throw new Error('Workspace not found')

  // Demote current master name if needed
  if (workspace.masterVersionId) {
    const idx = workspace.versions.findIndex(v => v.id === workspace.masterVersionId)
    if (idx !== -1) {
      workspace.versions[idx].name = `Version ${new Date(workspace.versions[idx].timestamp).toLocaleString()}`
    }
  }

  const newMaster: WorkspaceVersion = {
    id: uuid(),
    name: workspace.name,
    timestamp: new Date().toISOString(),
    graphState: serializeGraphState(graphState),
    description: 'Quick save',
    saveType,
    diff: 'Quick save update',
  }

  workspace.versions.unshift(newMaster)
  workspace.masterVersionId = newMaster.id
  workspace.updatedAt = new Date().toISOString()

  await saveWorkspaceToDB(workspace)
  return newMaster
}

export const saveVersion = async (workspaceId: string, graphState: any, saveType: 'auto' | 'quick' | 'manual', name = '', description = '') => {
  const workspace = await getWorkspace(workspaceId)
  if (!workspace) throw new Error('Workspace not found')

  const previousMaster = workspace.versions.find(v => v.id === workspace.masterVersionId)

  const newVersion: WorkspaceVersion = {
    id: uuid(),
    name: name || `Version ${new Date().toLocaleString()}`,
    timestamp: new Date().toISOString(),
    graphState: serializeGraphState(graphState),
    description,
    saveType,
    diff: generateUserFriendlyDiff(previousMaster?.graphState, serializeGraphState(graphState)),
  }

  workspace.versions.unshift(newVersion)
  workspace.masterVersionId = newVersion.id
  workspace.updatedAt = new Date().toISOString()

  await saveWorkspaceToDB(workspace)
  return newVersion
}

export const loadVersion = async (workspaceId: string, versionId: string) => {
  const workspace = await getWorkspace(workspaceId)
  if (!workspace) return null
  const idToLoad = versionId === 'master' ? workspace.masterVersionId : versionId
  return workspace.versions.find(v => v.id === idToLoad) || null
}

export const promoteVersion = async (workspaceId: string, versionId: string) => {
  const workspace = await getWorkspace(workspaceId)
  if (!workspace) return false

  const idx = workspace.versions.findIndex(v => v.id === versionId)
  if (idx === -1) return false

  // Demote old master
  if (workspace.masterVersionId) {
    const oldIdx = workspace.versions.findIndex(v => v.id === workspace.masterVersionId)
    if (oldIdx !== -1) workspace.versions[oldIdx].name = `Version ${new Date(workspace.versions[oldIdx].timestamp).toLocaleString()}`
  }

  workspace.versions[idx].name = 'Master'
  workspace.masterVersionId = versionId
  workspace.updatedAt = new Date().toISOString()
  await saveWorkspaceToDB(workspace)
  return true
}

export const deleteVersion = async (workspaceId: string, versionId: string) => {
  const workspace = await getWorkspace(workspaceId)
  if (!workspace) return false
  if (workspace.versions.length === 1) return false

  workspace.versions = workspace.versions.filter(v => v.id !== versionId)
  if (workspace.masterVersionId === versionId) workspace.masterVersionId = workspace.versions[0].id
  workspace.updatedAt = new Date().toISOString()
  await saveWorkspaceToDB(workspace)
  return true
}

export const deleteWorkspace = async (workspaceId: string) => {
  await deleteWorkspaceFromDB(workspaceId)
  return true
}

export const renameWorkspace = async (workspaceId: string, name: string, description: string) => {
  const workspace = await getWorkspace(workspaceId)
  if (!workspace) return false
  workspace.name = name
  workspace.description = description
  workspace.updatedAt = new Date().toISOString()
  await saveWorkspaceToDB(workspace)
  return true
}

export const renameVersion = async (workspaceId: string, versionId: string, name: string) => {
  const workspace = await getWorkspace(workspaceId)
  if (!workspace) return false
  const v = workspace.versions.find(v => v.id === versionId)
  if (!v) return false
  v.name = name
  workspace.updatedAt = new Date().toISOString()
  await saveWorkspaceToDB(workspace)
  return true
}

export const updateAutoSaveInterval = async (workspaceId: string, minutes: number) => {
  const workspace = await getWorkspace(workspaceId)
  if (!workspace) return false
  workspace.autoSaveInterval = minutes * 60 * 1000
  workspace.updatedAt = new Date().toISOString()
  await saveWorkspaceToDB(workspace)
  return true
}

// --- UTILITIES ---
const generateUserFriendlyDiff = (oldState: any, newState: any): string => {
  if (!oldState) return 'Initial version'
  const changes: string[] = []
  const oldNodes = oldState.nodes || []
  const newNodes = newState.nodes || []
  const oldNodeIds = new Set(oldNodes.map((n: any) => n.id))
  const newNodeIds = new Set(newNodes.map((n: any) => n.id))
  const addedNodes = newNodes.filter((n: any) => !oldNodeIds.has(n.id))
  const removedNodes = oldNodes.filter((n: any) => !newNodeIds.has(n.id))
  if (addedNodes.length) changes.push(`Added ${addedNodes.length} nodes`)
  if (removedNodes.length) changes.push(`Removed ${removedNodes.length} nodes`)

  const oldEdges = oldState.edges || []
  const newEdges = newState.edges || []
  const oldEdgeIds = new Set(oldEdges.map((e: any) => e.id))
  const newEdgeIds = new Set(newEdges.map((e: any) => e.id))
  const addedEdges = newEdges.filter((e: any) => !oldEdgeIds.has(e.id))
  const removedEdges = oldEdges.filter((e: any) => !newEdgeIds.has(e.id))
  if (addedEdges.length) changes.push(`Added ${addedEdges.length} connections`)
  if (removedEdges.length) changes.push(`Removed ${removedEdges.length} connections`)

  return changes.length ? changes.join(', ') : 'Minor updates'
}

// Data migration utilities preserved from Flowtrace – optional to call on app start
export const migrateOldData = async (): Promise<void> => {/* no-op placeholder; Flowtrace migration logic was for legacy project */}
export const cleanupInvalidWorkspaces = async (): Promise<void> => {/* likewise */}