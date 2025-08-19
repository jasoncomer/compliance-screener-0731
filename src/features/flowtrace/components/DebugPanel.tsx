import React, { useState } from 'react';
import { Bug, Eye, EyeOff, Trash2, Download, Upload } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';

interface DebugPanelProps {
  nodes: any[];
  connections: any[];
  onClearData?: () => void;
  onImportData?: (data: any) => void;
  className?: string;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({
  nodes,
  connections,
  onClearData,
  onImportData,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showDebugInfo, setShowDebugInfo] = useState(false);

  const handleExport = () => {
    const data = {
      nodes,
      connections,
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flowtrace-debug-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !onImportData) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        onImportData(data);
      } catch (error) {
        console.error('Failed to parse imported data:', error);
        alert('Failed to import data. Please check the file format.');
      }
    };
    reader.readAsText(file);
  };

  const stats = {
    nodes: nodes.length,
    connections: connections.length,
    customNodes: nodes.filter(n => n.type === 'custom').length,
    customConnections: connections.filter(c => c.customColor).length,
    totalDrawingElements: 0 // TODO: Add drawing history count
  };

  if (!isOpen) {
    return (
      <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
        <Button
          onClick={() => setIsOpen(true)}
          className="rounded-full w-12 h-12 p-0 shadow-lg"
          title="Debug Panel"
        >
          <Bug className="h-5 w-5" />
        </Button>
      </div>
    );
  }

  return (
    <div className={`fixed bottom-4 right-4 z-50 w-80 ${className}`}>
      <Card className="shadow-xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Bug className="h-5 w-5" />
              Debug Panel
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="h-6 w-6 p-0"
            >
              <EyeOff className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Statistics */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Statistics</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between">
                <span>Nodes:</span>
                <Badge variant="secondary">{stats.nodes}</Badge>
              </div>
              <div className="flex justify-between">
                <span>Connections:</span>
                <Badge variant="secondary">{stats.connections}</Badge>
              </div>
              <div className="flex justify-between">
                <span>Custom Nodes:</span>
                <Badge variant="outline">{stats.customNodes}</Badge>
              </div>
              <div className="flex justify-between">
                <span>Custom Colors:</span>
                <Badge variant="outline">{stats.customConnections}</Badge>
              </div>
            </div>
          </div>

          {/* Debug Info Toggle */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Debug Info</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDebugInfo(!showDebugInfo)}
                className="h-6 px-2"
              >
                {showDebugInfo ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              </Button>
            </div>
            
            {showDebugInfo && (
              <div className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded max-h-32 overflow-auto">
                <pre>{JSON.stringify({ nodes: stats.nodes, connections: stats.connections }, null, 2)}</pre>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Actions</h4>
            <div className="grid grid-cols-2 gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleExport}
                className="flex items-center gap-1"
              >
                <Download className="h-3 w-3" />
                Export
              </Button>
              
              <div className="relative">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full flex items-center gap-1"
                >
                  <Upload className="h-3 w-3" />
                  Import
                </Button>
              </div>
              
              {onClearData && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={onClearData}
                  className="flex items-center gap-1 col-span-2"
                >
                  <Trash2 className="h-3 w-3" />
                  Clear All Data
                </Button>
              )}
            </div>
          </div>

          {/* Performance */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Performance</h4>
            <div className="text-xs space-y-1">
              <div className="flex justify-between">
                <span>Memory Usage:</span>
                <span>{Math.round((performance as any).memory?.usedJSHeapSize / 1024 / 1024 || 0)}MB</span>
              </div>
              <div className="flex justify-between">
                <span>Render Time:</span>
                <span>{Date.now()}ms</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
