import React, { useEffect,useMemo, useState } from 'react';

import { MessageSquarePlus, Trash2 } from 'lucide-react';

import { Button } from '../../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data?: {
    from: string;
    to: string;
    amount?: number | string;
    currency?: string;
    txHash?: string;
    txid?: string;
    date?: string;
    usdValue?: string;
    note?: string;
  } | null;
  onSetColor?: (color: string) => void;
};

export const EdgeDialog: React.FC<Props> = ({ open, onOpenChange, data, onSetColor }) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteText, setNoteText] = useState(data?.note || '');
  const [currentNote, setCurrentNote] = useState(data?.note || '');

  // Update note text when data changes
  useEffect(() => {
    setNoteText(data?.note || '');
    setCurrentNote(data?.note || '');
  }, [data?.note]);

  const dateDisplay = useMemo(() => {
    if (!data?.date) return '—';
    return data.date.includes(',') ? 'Multiple' : data.date;
  }, [data?.date]);

  const handleEditNote = () => {
    setIsEditingNote(true);
    setNoteText(currentNote);
  };

  const handleSaveNote = () => {
    // Save note logic here - you can integrate with your notes API
    if (noteText.trim() === '') {
      console.log('Deleting note');
      setCurrentNote('');
    } else {
      console.log('Saving note:', noteText);
      setCurrentNote(noteText);
    }
    setIsEditingNote(false);
    // You would typically update the data here or call a callback
  };

  const handleCancelNote = () => {
    setIsEditingNote(false);
    setNoteText(currentNote);
  };

  const handleDeleteNote = () => {
    // Delete note logic here - you can integrate with your notes API
    console.log('Deleting note');
    setNoteText('');
    setCurrentNote('');
    setIsEditingNote(false);
    // You would typically update the data here or call a callback
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Transaction Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {data?.currency ? `${data.currency} Value:` : 'Value:'}
              </span>
              <span className="text-gray-900 dark:text-gray-100">
                {data?.usdValue ?? (data?.amount !== undefined ? `${String(data.amount)} ${data?.currency || ''}` : '—')}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-700 dark:text-gray-300">Date:</span>
              <span className="text-gray-900 dark:text-gray-100">
                {dateDisplay}
              </span>
            </div>
            {data?.txid && (
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-700 dark:text-gray-300">Transaction ID:</span>
                <span className="text-gray-900 dark:text-gray-100 font-mono text-sm">
                  {data.txid}
                </span>
              </div>
            )}
            {data?.txHash && (
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-700 dark:text-gray-300">Tx Hash:</span>
                <span className="text-gray-900 dark:text-gray-100 font-mono text-sm truncate max-w-[240px]">
                  {data.txHash}
                </span>
              </div>
            )}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-700 dark:text-gray-300">Note:</span>
                {!isEditingNote && (
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleEditNote}
                      className="h-6 w-6 p-0"
                      title="Edit note"
                    >
                      <MessageSquarePlus className="h-3 w-3" />
                    </Button>
                    {currentNote && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleDeleteNote}
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                        title="Delete note"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
              {isEditingNote ? (
                <div className="space-y-2">
                  <textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Add a note..."
                    className="w-full text-sm px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 resize-none"
                    rows={3}
                    onKeyDown={(e) => e.key === 'Escape' && handleCancelNote()}
                    autoFocus
                  />
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancelNote}
                      className="text-xs"
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleSaveNote}
                      className="text-xs"
                    >
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-gray-900 dark:text-gray-100 text-sm min-h-[20px]">
                  {currentNote ? (
                    <div className="whitespace-pre-wrap break-words">{currentNote}</div>
                  ) : (
                    <span className="text-gray-500 dark:text-gray-400 italic">No note added</span>
                  )}
                </div>
              )}
            </div>

          </div>
          
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <button 
              className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              onClick={() => setShowColorPicker(!showColorPicker)}
            >
              Customize Edge Color
            </button>
          </div>

          {showColorPicker && onSetColor && (
            <div className="pt-2">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Choose Color:</div>
              <div className="flex items-center gap-2">
                {['#9ca3af','#f97316','#ef4444','#10b981','#3b82f6','#a855f7'].map(c => (
                  <button 
                    key={c} 
                    className="h-8 w-8 rounded-full border-2 border-gray-300 hover:border-gray-400 transition-colors hover:scale-110" 
                    style={{ backgroundColor: c }} 
                    onClick={() => {
                      onSetColor(c);
                      setShowColorPicker(false);
                    }} 
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
