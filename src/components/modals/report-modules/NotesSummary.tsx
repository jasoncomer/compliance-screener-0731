import React, { useState } from 'react';
import { FileText, Plus, Edit3, Save, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

import { IComplianceTransaction } from '@/typings/compliance';

interface Note {
  id: string;
  title: string;
  content: string;
  author: string;
  createdAt: string;
  category: 'general' | 'compliance' | 'risk' | 'investigation';
}

interface NotesSummaryProps {
  transaction: IComplianceTransaction;
}

export const NotesSummary: React.FC<NotesSummaryProps> = ({
  transaction
}) => {
  const [notes, setNotes] = useState<Note[]>([
    {
      id: '1',
      title: 'Initial Review',
      content: 'Transaction appears to be a standard exchange transfer. No immediate red flags identified.',
      author: 'John Smith',
      createdAt: new Date().toISOString(),
      category: 'general'
    },
    {
      id: '2',
      title: 'Risk Assessment',
      content: 'Low risk transaction based on counterparty verification and amount. Proceeding with standard processing.',
      author: 'Sarah Johnson',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      category: 'risk'
    }
  ]);

  const [isAddingNote, setIsAddingNote] = useState(false);
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [newNote, setNewNote] = useState({ title: '', content: '', category: 'general' as const });

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'compliance':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'risk':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'investigation':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const handleAddNote = () => {
    if (newNote.title && newNote.content) {
      const note: Note = {
        id: Date.now().toString(),
        title: newNote.title,
        content: newNote.content,
        author: 'Current User', // In real app, get from auth context
        createdAt: new Date().toISOString(),
        category: newNote.category
      };
      setNotes(prev => [...prev, note]);
      setNewNote({ title: '', content: '', category: 'general' });
      setIsAddingNote(false);
    }
  };

  const handleEditNote = (noteId: string) => {
    setEditingNote(noteId);
  };

  const handleSaveEdit = (noteId: string, updatedContent: string) => {
    setNotes(prev => prev.map(note => 
      note.id === noteId 
        ? { ...note, content: updatedContent }
        : note
    ));
    setEditingNote(null);
  };

  const handleDeleteNote = (noteId: string) => {
    setNotes(prev => prev.filter(note => note.id !== noteId));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="h-6 w-6 text-blue-500" />
          <div>
            <h3 className="text-lg font-semibold">Transaction Notes</h3>
            <p className="text-sm text-gray-500">Add and manage notes for this transaction</p>
          </div>
        </div>
        <Button
          onClick={() => setIsAddingNote(true)}
          className="flex items-center gap-2"
          size="sm"
        >
          <Plus className="h-4 w-4" />
          Add Note
        </Button>
      </div>

      {/* Add Note Form */}
      {isAddingNote && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="note-title">Note Title</Label>
                  <Input
                    id="note-title"
                    value={newNote.title}
                    onChange={(e) => setNewNote(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter note title..."
                  />
                </div>
                <div>
                  <Label htmlFor="note-category">Category</Label>
                  <select
                    id="note-category"
                    value={newNote.category}
                    onChange={(e) => setNewNote(prev => ({ ...prev, category: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  >
                    <option value="general">General</option>
                    <option value="compliance">Compliance</option>
                    <option value="risk">Risk</option>
                    <option value="investigation">Investigation</option>
                  </select>
                </div>
              </div>
              <div>
                <Label htmlFor="note-content">Note Content</Label>
                <Textarea
                  id="note-content"
                  value={newNote.content}
                  onChange={(e) => setNewNote(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Enter note content..."
                  rows={4}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAddNote} size="sm">
                  <Save className="h-4 w-4 mr-2" />
                  Save Note
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsAddingNote(false);
                    setNewNote({ title: '', content: '', category: 'general' });
                  }}
                  size="sm"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes List */}
      <div className="space-y-4">
        {notes.map((note) => (
          <Card key={note.id}>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                      {note.title}
                    </h4>
                    <Badge className={getCategoryColor(note.category)}>
                      {note.category}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditNote(note.id)}
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteNote(note.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {editingNote === note.id ? (
                  <div className="space-y-2">
                    <Textarea
                      value={note.content}
                      onChange={(e) => setNotes(prev => prev.map(n => 
                        n.id === note.id ? { ...n, content: e.target.value } : n
                      ))}
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => handleSaveEdit(note.id, note.content)}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setEditingNote(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {note.content}
                  </p>
                )}

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>By {note.author}</span>
                  <span>{new Date(note.createdAt).toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {notes.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No notes added yet</p>
            <p className="text-sm text-gray-400">Add your first note to get started</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};