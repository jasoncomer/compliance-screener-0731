import { useEffect,useState } from 'react'

import {
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  Edit3,
  GitBranch,
  GitCommit,
  Info,
  MoreVertical,
  Plus,
  Save,
  Search,
  Trash2,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  createWorkspace,
  deleteWorkspace,
  getAllWorkspaces,
  renameWorkspace,
  saveVersion,
  type Workspace,
  type WorkspaceVersion,
} from '@/lib/workspace-utils'

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
  isSaveAndNewMode?: boolean
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [workspaceToDelete, setWorkspaceToDelete] = useState<Workspace | null>(null)
  const [renameDialogOpen, setRenameDialogOpen] = useState(false)
  const [workspaceToRename, setWorkspaceToRename] = useState<Workspace | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) loadWorkspaces()

  }, [open])

  // Keyboard navigation support
  useEffect(() => {
    if (!open) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && selectedWs && selectedVer) {
        e.preventDefault()
        onLoadWorkspace(selectedWs, selectedVer.id === 'master' ? 'master' : selectedVer.id)
        onOpenChange(false)
      } else if (e.key === 'Escape') {
        e.preventDefault()
        onOpenChange(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, selectedWs, selectedVer, onLoadWorkspace, onOpenChange])

  useEffect(() => {
    loadWorkspaces()
     
  }, [refreshTrigger])

  const loadWorkspaces = async () => {
    try {
      setIsLoading(true)
      setError(null)
      setWorkspaces(await getAllWorkspaces())
    } catch (err) {
      console.error('Error loading workspaces', err)
      setError('Failed to load workspaces. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveWorkspace = async () => {
    if (!newWorkspaceName.trim()) return
    try {
      setIsLoading(true)
      setError(null)
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
    } catch (err) {
      console.error('Error saving workspace', err)
      setError('Failed to save workspace. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteWorkspace = async () => {
    if (!workspaceToDelete) return
    try {
      setIsLoading(true)
      setError(null)
      await deleteWorkspace(workspaceToDelete.id)
      await loadWorkspaces()
      setDeleteDialogOpen(false)
      setWorkspaceToDelete(null)
      // Clear selection if deleted workspace was selected
      if (selectedWs?.id === workspaceToDelete.id) {
        setSelectedWs(null)
        setSelectedVer(null)
      }
    } catch (err) {
      console.error('Error deleting workspace', err)
      setError('Failed to delete workspace. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRenameWorkspace = async () => {
    if (!workspaceToRename || !renameValue.trim()) return
    try {
      setIsLoading(true)
      setError(null)
      await renameWorkspace(workspaceToRename.id, renameValue.trim(), workspaceToRename.description || '')
      await loadWorkspaces()
      setRenameDialogOpen(false)
      setWorkspaceToRename(null)
      setRenameValue('')
    } catch (err) {
      console.error('Error renaming workspace', err)
      setError('Failed to rename workspace. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const formatTimestamp = (ts: string, showTime: boolean = false) => {
    const date = new Date(ts)
    if (showTime) {
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`
    return date.toLocaleDateString()
  }

  const parseDiffSummary = (diff: string) => {
    // Parse diff string like "Added 3 nodes, Removed 1 connection"
    const parts = diff.split(',').map(p => p.trim())
    return parts.length > 0 ? parts.slice(0, 2).join(' • ') : diff
  }

  const getSaveTypeIcon = (t: string) => {
    switch (t) {
      case 'auto':
        return <Clock className="h-3 w-3" />
      case 'quick':
        return <Save className="h-3 w-3" />
      case 'manual':
        return <GitCommit className="h-3 w-3" />
      default:
        return <Save className="h-3 w-3" />
    }
  }

  return (
    <TooltipProvider>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <GitBranch className="h-5 w-5" /> Project Manager
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs z-[200]" sideOffset={5}>
                  <p>Projects store your investigation work. Each project can have multiple saved versions, allowing you to track your progress over time.</p>
                </TooltipContent>
              </Tooltip>
            </DialogTitle>
            <DialogDescription>
              Manage your investigation projects and versions.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col space-y-4 flex-1 min-h-0">
            {/* Error message */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3 flex-shrink-0">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* header */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search projects..." className="pl-10" />
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
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
                    <Plus className="h-4 w-4 mr-2" /> {currentWorkspaceId ? 'Save Version' : 'New Project'}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="z-[200]" sideOffset={5}>
                  {currentWorkspaceId ? 'Save current state as a new version' : 'Create a new project'}
                </TooltipContent>
              </Tooltip>
            </div>

            {/* list */}
            <div className="space-y-2 flex-1 overflow-y-auto min-h-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                    <p className="text-sm text-muted-foreground">Loading workspaces...</p>
                  </div>
                </div>
              ) : workspaces.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4">
                  <GitBranch className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No projects yet</h3>
                  <p className="text-sm text-muted-foreground text-center mb-4">
                    Create your first investigation project to get started
                  </p>
                  <Button onClick={() => setSaveDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" /> Create Project
                  </Button>
                </div>
              ) : (
                workspaces
                  .filter(w => w.name.toLowerCase().includes(searchQuery.toLowerCase()) || (w.description || '').toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(ws => {
                  const master = ws.versions.find(v => v.id === ws.masterVersionId) || ws.versions[0]
                  const expanded = expandedWorkspaces.has(ws.id)
                  const versionCount = ws.versions.length
                  const historyCount = ws.versions.filter(v => v.id !== ws.masterVersionId).length
                  const isSelected = selectedWs?.id === ws.id && selectedVer?.id === master?.id
                  const isActive = currentWorkspaceId === ws.id && currentVersionId === ws.masterVersionId

                  return (
                    <div key={ws.id} className="space-y-1">
                      <div
                        className={`border cursor-pointer transition-all duration-200 rounded-lg ${
                          isSelected
                            ? 'border-primary bg-primary/10 shadow-lg dark:bg-primary/20 ring-2 ring-primary/20'
                            : 'border-border bg-card hover:bg-accent hover:border-accent-foreground/20 hover:shadow-md'
                        }`}
                        onClick={() => {
                          setSelectedWs(ws);
                          setSelectedVer(master);
                        }}
                      >
                        <div className="p-4 flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="font-bold text-foreground text-base truncate">{ws.name}</span>
                              {isActive && (
                                <Badge variant="default" className="text-xs bg-blue-500 dark:bg-blue-600 flex-shrink-0">
                                  <Check className="h-3 w-3 mr-1" /> Active
                                </Badge>
                              )}
                              {isSelected && !isActive && (
                                <Badge variant="outline" className="text-xs border-primary text-primary flex-shrink-0">
                                  Selected
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{ws.description || 'No description'}</p>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <GitCommit className="h-3 w-3" />
                                {versionCount} {versionCount === 1 ? 'version' : 'versions'}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatTimestamp(ws.updatedAt)}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {historyCount > 0 && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setExpandedWorkspaces(prev => {
                                        const s = new Set(prev)
                                        s.has(ws.id) ? s.delete(ws.id) : s.add(ws.id)
                                        return s
                                      })
                                    }}
                                  >
                                    {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent side="bottom" className="z-[200]" sideOffset={5}>
                                  {expanded ? 'Hide' : 'Show'} {historyCount} previous {historyCount === 1 ? 'version' : 'versions'}
                                </TooltipContent>
                              </Tooltip>
                            )}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary" onClick={e => e.stopPropagation()}>
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation()
                                  setWorkspaceToRename(ws)
                                  setRenameValue(ws.name)
                                  setRenameDialogOpen(true)
                                }}>
                                  <Edit3 className="h-4 w-4 mr-2" /> Rename Project
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation()
                                  setWorkspaceToDelete(ws)
                                  setDeleteDialogOpen(true)
                                }} className="text-red-600">
                                  <Trash2 className="h-4 w-4 mr-2" /> Delete Project
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>

                      {/* versions */}
                      {expanded && (
                        <div className="ml-8 mt-2 max-h-64 overflow-y-auto space-y-2 pr-1 py-2 border-l-2 border-primary/20 pl-4">
                          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                            Version History ({historyCount})
                          </div>
                          {ws.versions
                            .filter(v => v.id !== ws.masterVersionId)
                            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                            .map((v, idx) => {
                              const isVersionSelected = selectedWs?.id === ws.id && selectedVer?.id === v.id
                              const isVersionActive = currentWorkspaceId === ws.id && currentVersionId === v.id

                              return (
                                <div
                                  key={v.id}
                                  className={`relative cursor-pointer rounded-lg transition-all duration-200 overflow-hidden group ${
                                    isVersionSelected
                                      ? 'bg-primary/15 dark:bg-primary/25 shadow-lg ring-2 ring-primary/50 border border-primary/30'
                                      : 'bg-muted/50 dark:bg-muted/30 hover:bg-muted/80 dark:hover:bg-muted/50 hover:shadow-md border border-transparent'
                                  }`}
                                  onClick={() => { setSelectedWs(ws); setSelectedVer(v); }}
                                >
                                  {/* Timeline connector */}
                                  {idx < ws.versions.filter(v => v.id !== ws.masterVersionId).length - 1 && (
                                    <div className="absolute left-3 top-full h-2 w-px bg-primary/20" />
                                  )}

                                  <div className="p-3 flex items-start gap-3">
                                    <div className="flex-shrink-0 mt-0.5">
                                      <div className={`p-1.5 rounded-full ${isVersionSelected ? 'bg-primary text-primary-foreground' : 'bg-muted-foreground/20 text-muted-foreground group-hover:bg-primary/30'}`}>
                                        {getSaveTypeIcon(v.saveType)}
                                      </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="text-sm font-semibold text-foreground truncate">{v.name}</span>
                                        {isVersionActive && (
                                          <Badge variant="default" className="text-xs bg-blue-500 dark:bg-blue-600 flex-shrink-0">
                                            <Check className="h-3 w-3 mr-1" /> Active
                                          </Badge>
                                        )}
                                        {isVersionSelected && !isVersionActive && (
                                          <Badge variant="outline" className="text-xs border-primary text-primary flex-shrink-0">
                                            Selected
                                          </Badge>
                                        )}
                                      </div>
                                      {v.description && (
                                        <p className="text-xs text-muted-foreground mb-1 line-clamp-1">{v.description}</p>
                                      )}
                                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <span>{formatTimestamp(v.timestamp, true)}</span>
                                        {v.diff && v.diff !== 'Initial version' && (
                                          <>
                                            <span>•</span>
                                            <span className="truncate">{parseDiffSummary(v.diff)}</span>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
            {/* confirm footer */}
            <div className="flex justify-between items-center pt-4 border-t flex-shrink-0">
              <div className="text-sm text-muted-foreground">
                {selectedWs && selectedVer ? (
                  <span>
                    <span className="font-medium text-foreground">{selectedWs.name}</span>
                    {' '}&gt;{' '}
                    <span className="font-medium text-foreground">{selectedVer.name}</span>
                  </span>
                ) : (
                  <span>No project selected</span>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button
                        disabled={!selectedWs || !selectedVer}
                        onClick={() => {
                          if (selectedWs && selectedVer) {
                            onLoadWorkspace(selectedWs, selectedVer.id==='master'? 'master': selectedVer.id);
                            onOpenChange(false);
                          }
                        }}
                      >
                        Open Project
                      </Button>
                    </span>
                  </TooltipTrigger>
                  {!selectedWs || !selectedVer ? (
                    <TooltipContent side="top" className="z-[200]" sideOffset={5}>
                      <p>Select a project or version to open</p>
                    </TooltipContent>
                  ) : null}
                </Tooltip>
              </div>
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
            <Button onClick={handleSaveWorkspace} disabled={isLoading || !newWorkspaceName.trim()}>
              {isLoading ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Workspace</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this workspace? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {workspaceToDelete && (
            <div className="py-4">
              <div className="bg-muted rounded-md p-4">
                <p className="font-semibold text-foreground">{workspaceToDelete.name}</p>
                <p className="text-sm text-muted-foreground mt-1">{workspaceToDelete.description || 'No description'}</p>
                <p className="text-sm text-muted-foreground mt-2">
                  {workspaceToDelete.versions.length} version{workspaceToDelete.versions.length !== 1 ? 's' : ''} will be deleted
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setDeleteDialogOpen(false)
              setWorkspaceToDelete(null)
            }} disabled={isLoading}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteWorkspace} disabled={isLoading}>
              {isLoading ? 'Deleting...' : 'Delete Workspace'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Workspace</DialogTitle>
            <DialogDescription>
              Enter a new name for your workspace.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="rename" className="text-right">
                Name
              </Label>
              <Input
                id="rename"
                value={renameValue}
                onChange={e => setRenameValue(e.target.value)}
                className="col-span-3"
                placeholder="Enter workspace name"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && renameValue.trim()) {
                    handleRenameWorkspace()
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setRenameDialogOpen(false)
              setWorkspaceToRename(null)
              setRenameValue('')
            }} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleRenameWorkspace} disabled={isLoading || !renameValue.trim()}>
              {isLoading ? 'Renaming...' : 'Rename'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  )
}