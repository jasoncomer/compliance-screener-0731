import React, { useEffect,useState } from 'react';

import { 
  AlertTriangle,
  CheckCircle,
  GitBranch,
  Plus, 
  Save} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { getAllWorkspaces, type Workspace } from '@/lib/workspace-utils';

interface SaveAndNewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaveToExisting: (workspaceId: string) => void;
  onCreateNew: (name: string, description: string) => void;
  onCancel: () => void;
}

export const SaveAndNewDialog: React.FC<SaveAndNewDialogProps> = ({
  open,
  onOpenChange,
  onSaveToExisting,
  onCreateNew,
  onCancel,
}) => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [newWorkspaceDescription, setNewWorkspaceDescription] = useState('');
  const [saveMode, setSaveMode] = useState<'existing' | 'new'>('existing');

  useEffect(() => {
    if (open) {
      loadWorkspaces();
    }
  }, [open]);

  const loadWorkspaces = async () => {
    try {
      const allWorkspaces = await getAllWorkspaces();
      setWorkspaces(allWorkspaces);
      if (allWorkspaces.length > 0) {
        setSelectedWorkspace(allWorkspaces[0]);
      }
    } catch (error) {
      console.error('Error loading workspaces:', error);
    }
  };

  const handleSaveToExisting = () => {
    if (selectedWorkspace) {
      onSaveToExisting(selectedWorkspace.id);
    }
  };

  const handleCreateNew = () => {
    if (newWorkspaceName.trim()) {
      onCreateNew(newWorkspaceName.trim(), newWorkspaceDescription.trim());
    }
  };

  const handleCancel = () => {
    setSaveMode('existing');
    setNewWorkspaceName('');
    setNewWorkspaceDescription('');
    setSelectedWorkspace(workspaces[0] || null);
    onCancel();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-5">
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20 flex-shrink-0">
              <Save className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <span>Save & Start New Investigation</span>
          </DialogTitle>
          <DialogDescription className="space-y-4 text-base">
            <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-4 w-full">
              <p className="font-medium text-blue-900 dark:text-blue-100 mb-3 text-base">
                Choose how to save your current work before starting the new investigation:
              </p>
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Save Mode Selection */}
          <div className="space-y-4">
            <div className="flex gap-4">
              <Button
                variant={saveMode === 'existing' ? 'default' : 'outline'}
                onClick={() => setSaveMode('existing')}
                className="flex-1"
                disabled={workspaces.length === 0}
              >
                <GitBranch className="h-4 w-4 mr-2" />
                Save to Existing Project
                {workspaces.length === 0 && (
                  <Badge variant="secondary" className="ml-2">No projects</Badge>
                )}
              </Button>
              <Button
                variant={saveMode === 'new' ? 'default' : 'outline'}
                onClick={() => setSaveMode('new')}
                className="flex-1"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create New Project
              </Button>
            </div>
          </div>

          {/* Existing Workspace Selection */}
          {saveMode === 'existing' && workspaces.length > 0 && (
            <div className="space-y-4">
              <Label className="text-base font-medium">Select Project</Label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {workspaces.map((workspace) => (
                  <div
                    key={workspace.id}
                    className={`border-2 cursor-pointer rounded-lg p-3 transition-colors ${
                      selectedWorkspace?.id === workspace.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                    onClick={() => setSelectedWorkspace(workspace)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 font-medium">
                          {workspace.name}
                          <Badge variant="outline" className="text-xs">
                            {workspace.versions.length} version{workspace.versions.length !== 1 ? 's' : ''}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {workspace.description || 'No description'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          Updated {new Date(workspace.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                      {selectedWorkspace?.id === workspace.id && (
                        <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New Workspace Creation */}
          {saveMode === 'new' && (
            <div className="space-y-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new-workspace-name" className="text-base font-medium">
                    Project Name *
                  </Label>
                  <Input
                    id="new-workspace-name"
                    value={newWorkspaceName}
                    onChange={(e) => setNewWorkspaceName(e.target.value)}
                    placeholder="Enter project name"
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-workspace-description" className="text-base font-medium">
                    Description
                  </Label>
                  <Textarea
                    id="new-workspace-description"
                    value={newWorkspaceDescription}
                    onChange={(e) => setNewWorkspaceDescription(e.target.value)}
                    placeholder="Enter project description (optional)"
                    className="w-full"
                    rows={3}
                  />
                </div>
              </div>
            </div>
          )}

          {/* No existing workspaces message */}
          {saveMode === 'existing' && workspaces.length === 0 && (
            <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                <p className="font-medium text-amber-900 dark:text-amber-100">
                  No existing projects found. Please create a new project.
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col gap-3 sm:flex-row sm:justify-end sm:gap-2 w-full">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          
          {saveMode === 'existing' && selectedWorkspace && (
            <Button
              onClick={handleSaveToExisting}
              className="w-full sm:w-auto flex items-center justify-center gap-2"
            >
              <Save className="h-4 w-4" />
              Save to "{selectedWorkspace.name}"
            </Button>
          )}
          
          {saveMode === 'new' && (
            <Button
              onClick={handleCreateNew}
              disabled={!newWorkspaceName.trim()}
              className="w-full sm:w-auto flex items-center justify-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Create & Save
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SaveAndNewDialog;