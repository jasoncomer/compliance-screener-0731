import React, { useEffect, useState } from 'react';

import { Settings } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAutosave } from '@/context/AutosaveContext';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  useD3Force: boolean;
  onUseD3ForceChange: (value: boolean) => void;
  utxoCollapseMode: "aggregated" | "individual";
  onUtxoCollapseModeChange: (mode: "aggregated" | "individual") => void;
  activeColor: string;
  onActiveColorChange: (color: string) => void;
  isExpanded: boolean;
  onIsExpandedChange: (expanded: boolean) => void;
}

const PRESET_COLORS = [
  { name: 'Orange', value: '#ff6b35' },
  { name: 'Red', value: '#ff0000' },
  { name: 'Green', value: '#00ff00' },
  { name: 'Blue', value: '#0000ff' },
  { name: 'Cyan', value: '#00ffff' },
  { name: 'Purple', value: '#8000ff' },
  { name: 'Teal', value: '#008080' },
  { name: 'Gold', value: '#ffa500' },
];

const AUTOSAVE_INTERVALS = [
  { label: '15 minutes', value: 15 },
  { label: '30 minutes', value: 30 },
  { label: '1 hour', value: 60 },
  { label: '2 hours', value: 120 },
  { label: '3 hours', value: 180 },
];

export const SettingsDialog: React.FC<SettingsDialogProps> = ({
  open,
  onOpenChange,
  useD3Force,
  onUseD3ForceChange,
  utxoCollapseMode,
  onUtxoCollapseModeChange,
  activeColor,
  onActiveColorChange,
  isExpanded,
  onIsExpandedChange,
}) => {
  const { autosaveInterval, setAutosaveInterval, isAutosaveEnabled, setIsAutosaveEnabled } = useAutosave();

  // Local state for settings
  const [localAutosaveEnabled, setLocalAutosaveEnabled] = useState(isAutosaveEnabled);
  const [localAutosaveInterval, setLocalAutosaveInterval] = useState(autosaveInterval);
  const [localUseD3Force, setLocalUseD3Force] = useState(useD3Force);
  const [localUtxoCollapseMode, setLocalUtxoCollapseMode] = useState(utxoCollapseMode);
  const [localActiveColor, setLocalActiveColor] = useState(activeColor);
  const [localIsExpanded, setLocalIsExpanded] = useState(isExpanded);

  // Sync local state when dialog opens or props change
  useEffect(() => {
    if (open) {
      setLocalAutosaveEnabled(isAutosaveEnabled);
      setLocalAutosaveInterval(autosaveInterval);
      setLocalUseD3Force(useD3Force);
      setLocalUtxoCollapseMode(utxoCollapseMode);
      setLocalActiveColor(activeColor);
      setLocalIsExpanded(isExpanded);
    }
  }, [open, isAutosaveEnabled, autosaveInterval, useD3Force, utxoCollapseMode, activeColor, isExpanded]);

  const handleSave = () => {
    // Save auto-save settings
    setIsAutosaveEnabled(localAutosaveEnabled);
    setAutosaveInterval(localAutosaveInterval);

    // Save visualization settings
    onUseD3ForceChange(localUseD3Force);
    localStorage.setItem('flowtrace-use-d3-force', localUseD3Force.toString());

    onUtxoCollapseModeChange(localUtxoCollapseMode);
    localStorage.setItem('flowtrace-utxo-collapse-mode', localUtxoCollapseMode);

    // Save drawing settings
    onActiveColorChange(localActiveColor);
    localStorage.setItem('flowtrace-default-drawing-color', localActiveColor);

    // Save panel settings
    onIsExpandedChange(localIsExpanded);

    onOpenChange(false);
  };

  const handleReset = () => {
    // Reset to defaults
    setLocalAutosaveEnabled(true);
    setLocalAutosaveInterval(60);
    setLocalUseD3Force(true);
    setLocalUtxoCollapseMode('individual');
    setLocalActiveColor('#ff6b35');
    setLocalIsExpanded(true);
  };

  const handleCancel = () => {
    // Revert to original values
    setLocalAutosaveEnabled(isAutosaveEnabled);
    setLocalAutosaveInterval(autosaveInterval);
    setLocalUseD3Force(useD3Force);
    setLocalUtxoCollapseMode(utxoCollapseMode);
    setLocalActiveColor(activeColor);
    setLocalIsExpanded(isExpanded);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            FlowTrace Settings
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="autosave" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="autosave">Auto-Save</TabsTrigger>
            <TabsTrigger value="visualization">Visualization</TabsTrigger>
            <TabsTrigger value="drawing">Drawing</TabsTrigger>
            <TabsTrigger value="panels">Panels</TabsTrigger>
          </TabsList>

          {/* Auto-Save Settings */}
          <TabsContent value="autosave" className="space-y-4 py-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="autosave-enabled">Enable Auto-Save</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically save your workspace at regular intervals
                  </p>
                </div>
                <Switch
                  id="autosave-enabled"
                  checked={localAutosaveEnabled}
                  onCheckedChange={setLocalAutosaveEnabled}
                />
              </div>

              {localAutosaveEnabled && (
                <div className="space-y-2">
                  <Label htmlFor="autosave-interval">Auto-Save Interval</Label>
                  <Select
                    value={localAutosaveInterval.toString()}
                    onValueChange={(value) => setLocalAutosaveInterval(parseInt(value, 10))}
                  >
                    <SelectTrigger id="autosave-interval">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AUTOSAVE_INTERVALS.map((interval) => (
                        <SelectItem key={interval.value} value={interval.value.toString()}>
                          {interval.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    Workspace will be saved every {localAutosaveInterval} minutes when there are unsaved changes
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Visualization Settings */}
          <TabsContent value="visualization" className="space-y-4 py-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="d3-force">D3 Force Layout</Label>
                  <p className="text-sm text-muted-foreground">
                    Use physics-based force simulation for node positioning
                  </p>
                </div>
                <Switch
                  id="d3-force"
                  checked={localUseD3Force}
                  onCheckedChange={setLocalUseD3Force}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="utxo-mode">UTXO Display Mode</Label>
                <Select
                  value={localUtxoCollapseMode}
                  onValueChange={(value) => setLocalUtxoCollapseMode(value as "aggregated" | "individual")}
                >
                  <SelectTrigger id="utxo-mode">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Individual</SelectItem>
                    <SelectItem value="aggregated">Aggregated</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  {localUtxoCollapseMode === 'individual'
                    ? 'Show each UTXO connection separately'
                    : 'Combine multiple UTXOs into single connections'}
                </p>
              </div>
            </div>
          </TabsContent>

          {/* Drawing Settings */}
          <TabsContent value="drawing" className="space-y-4 py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="default-color">Default Drawing Color</Label>
                <div className="flex gap-2">
                  <div className="grid grid-cols-4 gap-2 flex-1">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color.value}
                        onClick={() => setLocalActiveColor(color.value)}
                        className={`h-10 rounded border-2 transition-all ${
                          localActiveColor === color.value
                            ? 'border-primary ring-2 ring-primary ring-offset-2'
                            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                        }`}
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="color"
                      value={localActiveColor}
                      onChange={(e) => setLocalActiveColor(e.target.value)}
                      className="w-20 h-10 cursor-pointer"
                    />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Selected: {localActiveColor.toUpperCase()}
                </p>
              </div>
            </div>
          </TabsContent>

          {/* Panel Settings */}
          <TabsContent value="panels" className="space-y-4 py-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="left-panel-expanded">Expand Left Panel by Default</Label>
                  <p className="text-sm text-muted-foreground">
                    Show the left information panel when selecting nodes
                  </p>
                </div>
                <Switch
                  id="left-panel-expanded"
                  checked={localIsExpanded}
                  onCheckedChange={setLocalIsExpanded}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={handleReset}>
            Reset to Defaults
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Settings
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};