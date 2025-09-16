import React, { useEffect, useState } from 'react';
import { flowtraceService } from '../../../services/flowtraceService';
import { Button } from '../../../components/ui/button';
import { Textarea } from '../../../components/ui/textarea';
import { Card, CardContent } from '../../../components/ui/card';
import { Edit, Trash2, Plus, X, Check, StickyNote } from 'lucide-react';
import { INote } from '../../../api/notes';

interface Note {
  _id: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
  createdBy: {
    firstName: string;
    lastName: string;
  };
}

interface AddressNotesProps {
  address: string | null;
  cospendId?: string | null;
  organizationId?: string;
}

const AddressNotes: React.FC<AddressNotesProps> = ({ address, cospendId, organizationId }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [noteType, setNoteType] = useState<'address' | 'cluster'>('address');

  useEffect(() => {
    if (address) {
      fetchNotes();
    } else {
      setNotes([]);
    }
  }, [address, noteType, cospendId]);

  const fetchNotes = async () => {
    if (!address) return;
    
    setLoading(true);
    try {
      let response;
      
      if (noteType === 'cluster' && cospendId) {
        response = await flowtraceService.fetchClusterNotes(cospendId, organizationId);
      } else {
        response = await flowtraceService.fetchAddressNotes(address, organizationId);
      }
      
      if (response.success) {
        // Convert API response to component format
        const notes = (response.data || []).map((note: INote) => ({
          ...note,
          createdBy: {
            firstName: note.creatorName?.split(' ')[0] || 'Unknown',
            lastName: note.creatorName?.split(' ').slice(1).join(' ') || 'User'
          }
        }));
        setNotes(notes);
      }
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNote = async () => {
    if (!address || !newNote.trim()) return;
    
    setSubmitting(true);
    try {
      let response;
      
      if (noteType === 'cluster' && cospendId) {
        response = await flowtraceService.createClusterNote(cospendId, newNote.trim(), organizationId);
      } else {
        response = await flowtraceService.createAddressNote(address, newNote.trim(), organizationId);
      }
      
      if (response.success) {
        setNewNote('');
        setShowAddForm(false);
        await fetchNotes();
      }
    } catch (error) {
      console.error('Error creating note:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateNote = async (noteId: string) => {
    if (!editContent.trim()) return;
    
    setSubmitting(true);
    try {
      const response = await flowtraceService.updateNote(noteId, editContent.trim(), organizationId);
      if (response.success) {
        setEditingNote(null);
        setEditContent('');
        await fetchNotes();
      }
    } catch (error) {
      console.error('Error updating note:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;
    
    setSubmitting(true);
    try {
      const response = await flowtraceService.deleteNote(noteId, organizationId);
      if (response.success) {
        await fetchNotes();
      }
    } catch (error) {
      console.error('Error deleting note:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const startEditing = (note: Note) => {
    setEditingNote(note._id);
    setEditContent(note.content);
  };

  const cancelEditing = () => {
    setEditingNote(null);
    setEditContent('');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString() + ' ' + new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!address) {
    return (
      <div className="text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 text-gray-400">
          <StickyNote className="h-4 w-4" />
          <span>Select an address to view notes</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Note Type Toggle */}
      {address && (
        <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Notes for:</span>
          <div className="flex bg-white dark:bg-gray-700 rounded-md p-1">
            <button
              onClick={() => setNoteType('address')}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                noteType === 'address'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
              }`}
            >
              Address
            </button>
            <button
              onClick={() => setNoteType('cluster')}
              disabled={!cospendId}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                noteType === 'cluster'
                  ? 'bg-blue-500 text-white'
                  : !cospendId
                  ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
              }`}
            >
              Cluster {!cospendId && '(N/A)'}
            </button>
          </div>
          {noteType === 'cluster' && (
            <span className="text-xs text-gray-500 dark:text-gray-400 font-mono truncate max-w-[120px]" title={cospendId || undefined}>
              {cospendId}
            </span>
          )}
        </div>
      )}

      {/* Add Note Button */}
      {!showAddForm && (
        <Button
          onClick={() => setShowAddForm(true)}
          size="sm"
          variant="outline"
          className="w-full"
        >
          <Plus className="h-3 w-3 mr-2" />
          Add {noteType === 'cluster' ? 'Cluster' : 'Address'} Note
        </Button>
      )}

      {/* Add Note Form */}
      {showAddForm && (
        <Card className="border border-gray-200 dark:border-gray-700">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Add {noteType === 'cluster' ? 'Cluster' : 'Address'} Note
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setShowAddForm(false);
                  setNewNote('');
                }}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            <Textarea
              placeholder={`Add a note about this ${noteType === 'cluster' ? 'cluster' : 'address'}...`}
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              className="mb-2"
              rows={3}
            />
            <div className="flex gap-2">
              <Button
                onClick={handleCreateNote}
                disabled={!newNote.trim() || submitting}
                size="sm"
                className="flex-1"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Note
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setShowAddForm(false);
                  setNewNote('');
                }}
                disabled={submitting}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes List */}
      {loading ? (
        <div className="text-center py-4 text-gray-500 dark:text-gray-400">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-500 mx-auto mb-2"></div>
          Loading notes...
        </div>
      ) : notes.length === 0 ? (
        <div className="text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 text-gray-400">
            <StickyNote className="h-4 w-4" />
            <span>No notes yet. Click "Add Note" to create one.</span>
          </div>
        </div>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {notes.map((note) => (
            <Card key={note._id} className="border border-gray-200 dark:border-gray-700">
              <CardContent className="p-3">
                {editingNote === note._id ? (
                  <div>
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="mb-2"
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleUpdateNote(note._id)}
                        disabled={!editContent.trim() || submitting}
                      >
                        <Check className="h-3 w-3 mr-1" />
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={cancelEditing}
                        disabled={submitting}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-gray-900 dark:text-white mb-2">
                      {note.content}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>
                        {note.createdBy?.firstName} {note.createdBy?.lastName} • {formatDate(note.createdAt)}
                      </span>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => startEditing(note)}
                          className="h-6 w-6 p-0"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteNote(note._id)}
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AddressNotes;
