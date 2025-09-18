import { useState } from 'react';
import { Save as SaveIcon, Check } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { updateMasterVersion } from '@/lib/workspace-utils';
import { Button } from '@/components/ui/button';

interface SaveWorkspaceButtonProps {
  workspaceId: string | null;
  graphState: any; // the latest graph state from NetworkGraph
  onSaveSuccess?: () => void; // Callback when save is successful
}

export default function SaveWorkspaceButton({ workspaceId, graphState, onSaveSuccess }: SaveWorkspaceButtonProps) {
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    if (!workspaceId) return;
    try {
      await updateMasterVersion(workspaceId, graphState, 'manual');
      setSaved(true);
      onSaveSuccess?.(); // Notify parent that save was successful
      setTimeout(() => setSaved(false), 1500);
    } catch (error) {
      console.error('Failed to save workspace:', error);
    }
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Save workspace" onClick={handleSave}>
            {saved ? <Check className="h-4 w-4 text-green-500" /> : <SaveIcon className="h-4 w-4" />}
          </Button>
        </TooltipTrigger>
        <TooltipContent>Save workspace</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}