import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  getAllWorkspaces,
  saveVersion,
  createWorkspace,
  deleteWorkspace,
  renameWorkspace,
  type Workspace,
  type WorkspaceVersion,
} from '@/lib/workspace-utils'
import {
  Save,
  Trash2,
  Edit3,
  Star,
  Clock,
  GitBranch,
  GitCommit,
  Plus,
  Search,
  MoreVertical,
  ChevronDown,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface GitHubWorkspaceManagerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentState: any
  onLoadWorkspace: (workspace: Workspace, versionId?: string) => void
  currentWorkspaceId?: string
  currentVersionId?: string
  onWorkspaceCreated?: (workspaceId: string) => void
  onStartNewInvestigation?: (workspaceId: string) => void
  refreshTrigger?: number
}

export default function GitHubWorkspaceManager(props: GitHubWorkspaceManagerProps) {
  const {
    open,
    onOpenChange,
    currentState,
    onLoadWorkspace,
    currentWorkspaceId,
    currentVersionId,
    onWorkspaceCreated,
    onStartNewInvestigation,
    refreshTrigger,
  } = props

  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedWorkspaces, setExpandedWorkspaces] = useState<Set<string>>(new Set())
  const [selectedWs, setSelectedWs] = useState<Workspace | null>(null)
  const [selectedVer, setSelectedVer] = useState<WorkspaceVersion | null>(null)
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [newWorkspaceName, setNewWorkspaceName] = useState('')
  const [newWorkspaceDescription, setNewWorkspaceDescription] = useState('')

  useEffect(() => {
    if (open) loadWorkspaces()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    loadWorkspaces()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger])

  const loadWorkspaces = async () => {
    try {
      setWorkspaces(await getAllWorkspaces())
    } catch (err) {
      console.error('Error loading workspaces', err)
    }
  }

  const handleSaveWorkspace = async () => {
    if (!newWorkspaceName.trim()) return
    let workspaceId: string
    if (currentWorkspaceId) {
      await saveVersion(currentWorkspaceId, currentState, 'manual', newWorkspaceName, newWorkspaceDescription)
      workspaceId = currentWorkspaceId
    } else {
      const ws = await createWorkspace(currentState, newWorkspaceName, newWorkspaceDescription)
      workspaceId = ws.id
    }
    await loadWorkspaces()
    setSaveDialogOpen(false)
    setNewWorkspaceName('')
    setNewWorkspaceDescription('')
    if (!currentWorkspaceId && onWorkspaceCreated) onWorkspaceCreated(workspaceId)
  }

  const formatTimestamp = (ts: string) => {
    const date = new Date(ts)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`
    return date.toLocaleDateString()
  }

  const getSaveTypeIcon = (t: string) => {
    switch (t) {
      case 'auto':
        return <Clock className="h-4 w-4" />
      case 'quick':
        return <Save className="h-4 w-4" />
      case 'manual':
        return <GitCommit className="h-4 w-4" />
      default:
        return <Save className="h-4 w-4" />
    }
  }

  const getSaveTypeColor = (t: string) => {
    switch (t) {
      case 'auto':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'quick':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'manual':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitBranch className="h-5 w-5" /> Project Manager
            </DialogTitle>
            <DialogDescription>
              Manage your investigation projects and versions.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col space-y-4 h-full">
            {/* header */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search projects..." className="pl-10" />
              </div>
              <Button
                onClick={async () => {
                  if (currentWorkspaceId) {
                    await saveVersion(currentWorkspaceId, currentState, 'manual', `Version ${new Date().toLocaleString()}`, 'Quick save')
                    await loadWorkspaces()
                  } else {
                    setSaveDialogOpen(true)
                  }
                }}
              >
                <Plus className="h-4 w-4 mr-2" /> New
              </Button>
            </div>

            {/* list */}
            <div className="space-y-2 max-h-[70vh] overflow-y-auto">
              {workspaces
                .filter(w => w.name.toLowerCase().includes(searchQuery.toLowerCase()) || (w.description || '').toLowerCase().includes(searchQuery.toLowerCase()))
                .map(ws => {
                  const master = ws.versions.find(v => v.id === ws.masterVersionId) || ws.versions[0]
                  const expanded = expandedWorkspaces.has(ws.id)
                  return (
                    <div key={ws.id} className="space-y-1">
                      <div
                        className="border-2 border-primary/20 cursor-pointer bg-gradient-to-r from-primary/5 to-primary/10 hover:bg-accent/50 transition-colors"
                        onClick={() => { /* select master */ setSelectedWs(ws); setSelectedVer(master); }}
                      >
                        <div className="p-3 flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 font-bold text-primary text-sm">
                              {ws.name}
                              <Star className="h-4 w-4 text-yellow-500 fill-current" />
                              <Badge variant="outline" className="text-xs text-green-600 border-green-300 bg-green-50 dark:text-green-400 dark:border-green-600 dark:bg-green-900/20">Master</Badge>
                              {currentWorkspaceId===ws.id && currentVersionId===ws.masterVersionId && (
                                <Badge variant="outline" className="text-xs text-blue-600 border-blue-300 bg-blue-50 dark:text-blue-400 dark:border-blue-600 dark:bg-blue-900/20">Working</Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">{ws.description || 'No description'}</p>
                            {master && (
                              <div className="flex items-center gap-2 mt-1">
                                <Badge className={`text-xs ${getSaveTypeColor(master.saveType)}`}>{getSaveTypeIcon(master.saveType)}{master.saveType}</Badge>
                                <span className="text-xs text-muted-foreground">{formatTimestamp(master.timestamp)}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" onClick={e => { e.stopPropagation(); setExpandedWorkspaces(prev => { const s = new Set(prev); s.has(ws.id) ? s.delete(ws.id) : s.add(ws.id); return s }) }}>
                              <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" onClick={e => e.stopPropagation()}>
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => onStartNewInvestigation?.(ws.id)}>
                                  <Plus className="h-4 w-4 mr-2" /> Start New Investigation
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => renameWorkspace(ws.id, prompt('New name', ws.name) || ws.name, ws.description || '')}>
                                  <Edit3 className="h-4 w-4 mr-2" /> Rename
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => deleteWorkspace(ws.id)} className="text-red-600">
                                  <Trash2 className="h-4 w-4 mr-2" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>

                      {/* versions */}
                      {expanded && (
                        <div className="ml-4 max-h-48 overflow-y-auto space-y-1">
                          {ws.versions.filter(v => v.id !== ws.masterVersionId).map(v => (
                            <div key={v.id} className="border border-muted/50 cursor-pointer bg-muted/20 hover:bg-accent/30" onClick={() => { setSelectedWs(ws); setSelectedVer(v); }}>
                              <div className="p-3 flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    {v.name}
                                    {selectedWs?.id===ws.id && selectedVer?.id===v.id && (
                                      <Badge variant="outline" className="text-xs text-orange-600 border-orange-300 bg-orange-50 dark:text-orange-400 dark:border-orange-600 dark:bg-orange-900/20">Selected</Badge>
                                    )}
                                    {currentWorkspaceId === ws.id && currentVersionId === v.id && (
                                      <Badge variant="outline" className="text-xs text-blue-600 border-blue-300 bg-blue-50 dark:text-blue-400 dark:border-blue-600 dark:bg-blue-900/20">
                                        Working
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge className={`text-xs ${getSaveTypeColor(v.saveType)}`}>{getSaveTypeIcon(v.saveType)}{v.saveType}</Badge>
                                    <span className="text-xs text-muted-foreground">{formatTimestamp(v.timestamp)}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
            </div>
            {/* confirm footer */}
            <div className="flex justify-end pt-4">
              <Button variant="outline" className="mr-2" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button disabled={!selectedWs || !selectedVer} onClick={() => { if (selectedWs && selectedVer) { onLoadWorkspace(selectedWs, selectedVer.id==='master'? 'master': selectedVer.id); onOpenChange(false); } }}>Open</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Save Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Workspace</DialogTitle>
            <DialogDescription>
              Save the current state of your investigation to a new workspace or version.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={newWorkspaceName}
                onChange={e => setNewWorkspaceName(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea
                id="description"
                value={newWorkspaceDescription}
                onChange={e => setNewWorkspaceDescription(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveWorkspace}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}