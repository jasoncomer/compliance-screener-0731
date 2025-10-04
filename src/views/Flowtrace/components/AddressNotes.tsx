import React, { useEffect, useState } from 'react';

import { Plus, StickyNote, Trash2 } from 'lucide-react';

import { INote } from '../../../api/notes';
import { Textarea } from '../../../components/ui/textarea';
import { flowtraceService } from '../../../services/flowtraceService';

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
  organizationId?: string;
}

export const AddressNotes: React.FC<AddressNotesProps> = ({ address, organizationId }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (address) {
      fetchNotes();
    } else {
      setNotes([]);
    }
  }, [address]);

  const fetchNotes = async () => {
    if (!address) return;

    // Don't attempt to fetch notes if organizationId is missing
    if (!organizationId) {
      console.warn('Cannot fetch notes: Organization ID is missing');
      return;
    }

    setLoading(true);
    try {
      const response = await flowtraceService.fetchAddressNotes(address, organizationId);

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

  const handleSaveNote = async () => {
    if (!address || !noteContent.trim() || !organizationId) return;

    setSubmitting(true);
    try {
      const response = await flowtraceService.createAddressNote(address, noteContent.trim(), organizationId);

      if (response.success) {
        setNoteContent('');
        await fetchNotes();
      }
    } catch (error) {
      console.error('Error saving note:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?') || !organizationId) return;

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

  if (!organizationId) {
    return (
      <div className="text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 text-gray-400">
          <StickyNote className="h-4 w-4" />
          <span>Organization not available - notes feature disabled</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Note Input - Always visible */}
      <div className="relative">
        <Textarea
          placeholder="Add a note about this address..."
          value={noteContent}
          onChange={(e) => setNoteContent(e.target.value)}
          className="text-sm resize-none pr-10 focus-visible:ring-offset-0"
          rows={3}
          disabled={submitting}
        />
        {noteContent.trim() && (
          <button
            onClick={handleSaveNote}
            disabled={submitting}
            className="absolute bottom-2 right-2 p-1.5 rounded-md bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Save note"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Notes List */}
      {loading ? (
        <div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-500 mx-auto mb-2"></div>
          Loading notes...
        </div>
      ) : notes.length === 0 ? (
        <div className="text-xs text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 flex items-center gap-2">
          <StickyNote className="h-3.5 w-3.5" />
          <span>No notes yet</span>
        </div>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {notes.map((note) => (
            <div
              key={note._id}
              className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <p className="text-sm text-gray-900 dark:text-white mb-2 whitespace-pre-wrap">
                {note.content}
              </p>
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>
                  {note.createdBy?.firstName} {note.createdBy?.lastName} • {formatDate(note.createdAt)}
                </span>
                <button
                  onClick={() => handleDeleteNote(note._id)}
                  disabled={submitting}
                  className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors disabled:opacity-50"
                  title="Delete note"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
