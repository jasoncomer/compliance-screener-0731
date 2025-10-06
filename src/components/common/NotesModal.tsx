import React, { useEffect, useRef, useState } from 'react';

import { Delete, Edit, ArrowRight } from 'lucide-react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Modal } from '../ui/modal';
import { Textarea } from '../ui/textarea';


import { ICreateNote, INote, notesApi } from '../../api/notes';
import { useAppContext } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import { selectCurrentOrganization } from '../../store/slices/organizationsSlice';
import { truncateAddress } from '../../utils/crypto';

interface ThemeProps {
  themeMode: string;
}

// Helper function to get context ID
const getContextId = (transactionId?: string, address?: string) => {
  return transactionId || address;
};

// Base styles for note bubbles
const NoteItemBase = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'themeMode'
})<ThemeProps>`
  padding: 12px 16px;
  margin-bottom: 10px;
  border-radius: 12px;
  max-width: 85%;
  position: relative;
`;

// Note from current user (right-aligned)
const CurrentUserNote = styled(NoteItemBase).withConfig({
  shouldForwardProp: (prop) => prop !== 'themeMode'
})`
  margin-left: auto;
  background-color: ${({ themeMode }) => themeMode === 'dark' ? '#A53D10' : '#E7C0AE'};
  border-bottom-right-radius: 4px;
  ${({ themeMode }) => themeMode === 'dark' ? 'color: white;' : 'color: #333;'}
  
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    right: -8px;
    width: 0;
    height: 0;
    border: 8px solid transparent;
    border-left-color: ${({ themeMode }) => themeMode === 'dark' ? '#A53D10' : '#E7C0AE'};
    border-right: 0;
    border-bottom: 0;
  }
`;

// Note from other users (left-aligned)
const OtherUserNote = styled(NoteItemBase).withConfig({
  shouldForwardProp: (prop) => prop !== 'themeMode'
})`
  margin-right: auto;
  background-color: ${({ themeMode }) => themeMode === 'dark' ? '#2a2a2a' : '#f5f5f5'};
  border-bottom-left-radius: 4px;
  
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: -8px;
    width: 0;
    height: 0;
    border: 8px solid transparent;
    border-right-color: ${({ themeMode }) => themeMode === 'dark' ? '#2a2a2a' : '#f5f5f5'};
    border-left: 0;
    border-bottom: 0;
  }
`;

// Action icons container
const ActionIcons = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'themeMode'
})<ThemeProps>`
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  gap: 6px;
  opacity: 0;
  transition: opacity 0.2s ease;

  ${NoteItemBase}:hover & {
    opacity: 1;
  }
`;

const ActionIcon = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'themeMode'
})<ThemeProps>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 4px;
  cursor: pointer;
  color: ${({ themeMode }) => themeMode === 'dark' ? '#ddd' : '#666'};
  
  &:hover {
    background-color: ${({ themeMode }) => themeMode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'};
  }
`;

const NoteContent = styled.div`
  margin-bottom: 8px;
  white-space: pre-wrap;
  font-size: 14px;
  padding-right: 65px;
`;

const NoteFooter = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'themeMode'
})<ThemeProps>`
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: ${({ themeMode }) => themeMode === 'dark' ? '#bbb' : '#666'};
`;

const NotesContainer = styled.div`
  max-height: 350px;
  overflow-y: auto;
  margin-bottom: 16px;
  padding: 8px 8px 0 8px;
  
  &::-webkit-scrollbar {
    width: 4px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: #555;
  }
`;

// Removed ChatDate styled component - using Tailwind classes instead

// Removed styled-components - using Tailwind classes instead

interface NotesModalProps {
  visible: boolean;
  onClose: () => void;
  transactionId?: string;
  address?: string;
  blockNumber?: string;
  cospendId?: string;
  type?: 'general' | 'transaction' | 'address' | 'block';
  onNewNotesCountChange?: (count: number) => void;
}

// Simple message utility - you can replace this with your preferred toast/notification system
const useCustomMessage = () => {
  const message = {
    success: (content: string) => {
      console.log('Success:', content);
      // TODO: Replace with your toast/notification system
    },
    error: (content: string) => {
      console.error('Error:', content);
      // TODO: Replace with your toast/notification system
    },
    warning: (content: string) => {
      console.warn('Warning:', content);
      // TODO: Replace with your toast/notification system
    },
    info: (content: string) => {
      console.info('Info:', content);
      // TODO: Replace with your toast/notification system
    }
  };
  
  return message;
};

const NotesModal: React.FC<NotesModalProps> = ({ 
  visible, 
  onClose, 
  transactionId,
  address, 
  cospendId,
  type = 'general',
  onNewNotesCountChange
}) => {
  const { theme } = useTheme();
  const { user: currentUser } = useAppContext();
  const message = useCustomMessage(); // Use our custom message hook
  const [notes, setNotes] = useState<INote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [unseenNotesCount, setUnseenNotesCount] = useState(0);
  const [noteType, setNoteType] = useState<'address' | 'cluster'>('address');
  const currentOrganization = useSelector(selectCurrentOrganization);
  const notesContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when notes change
  useEffect(() => {
    if (visible && notesContainerRef.current && notes.length > 0) {
      setTimeout(() => {
        if (notesContainerRef.current) notesContainerRef.current.scrollTop = notesContainerRef.current.scrollHeight;
      }, 100);
    }
  }, [notes, visible]);

  // Mark notes as viewed when modal opens
  useEffect(() => {
    const markNotesAsViewed = async () => {
      if (visible && currentUser && currentUser._id && currentOrganization && (transactionId || address)) {
        const contextId = getContextId(transactionId, address);
        if (contextId) {
          try {
            await notesApi.markAsViewed(currentOrganization._id, {
              contextType: type as 'general' | 'transaction' | 'address' | 'cluster',
              contextId
            });
            
            // Reset unseen count when user views the notes
            setUnseenNotesCount(0);
          } catch (error) {
            if (process.env.NODE_ENV === 'development') console.error('Failed to mark notes as viewed:', error);
          }
        }
      }
    };

    markNotesAsViewed();
  }, [visible, currentUser, currentOrganization, transactionId, address, type]);

  // Calculate unseen count when component mounts or context changes
  useEffect(() => {
    const calculateUnseenCount = async () => {
      if (!currentUser || !currentUser._id || !currentOrganization || !(transactionId || address)) {
        return;
      }

      const contextId = getContextId(transactionId, address);
      if (!contextId) return;

      try {
        // Get unseen count from API
        const response = await notesApi.getUnseenCount(
          currentOrganization._id,
          type,
          contextId
        );
        
        setUnseenNotesCount(response.data.count);
      } catch (error: any) {
        // Only log non-404 errors in development
        if (process.env.NODE_ENV === 'development' && error?.response?.status !== 404) {
          console.error('Failed to calculate unseen count:', error);
        }
        // Fallback: set count to 0 if API fails
        setUnseenNotesCount(0);
      }
    };

    calculateUnseenCount();
  }, [currentUser, currentOrganization, transactionId, address, type]);

  // Notify parent component when unseen notes count changes
  useEffect(() => {
    if (onNewNotesCountChange) {
      onNewNotesCountChange(unseenNotesCount);
    }
  }, [unseenNotesCount, onNewNotesCountChange]);

  // Load notes when modal opens
  useEffect(() => {
    if (visible && currentOrganization) fetchNotes();
  }, [visible, currentOrganization, transactionId, address, cospendId, type, noteType]);

  // Fetch notes from API
  const fetchNotes = async () => {
    if (!currentOrganization) return;
    
    try {
      setLoading(true);
      let response;

      if ((type as string) === 'transaction' && transactionId) {
        response = await notesApi.getTransactionNotes(currentOrganization._id, transactionId);
      } else if ((type as string) === 'address' && address) {
        if (noteType === 'cluster' && cospendId) {
          response = await notesApi.getClusterNotes(currentOrganization._id, cospendId);
        } else {
          response = await notesApi.getAddressNotes(currentOrganization._id, address);
        }
      } else {
        response = await notesApi.list(currentOrganization._id);
      }

      setNotes(response.data || []);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') console.error('Failed to fetch notes:', error);
      message.error('Failed to load notes');
    } finally {
      setLoading(false);
    }
  };

  // Add a new note
  const handleAddNote = async () => {
    if (!newNote.trim() || !currentOrganization) return;

    try {
      setSubmitting(true);
      const noteData: ICreateNote = { 
        content: newNote.trim(),
        type: type as 'general' | 'transaction' | 'address' | 'cluster',
        ...((type as string) === 'transaction' && transactionId ? { transactionId } : {}),
        ...((type as string) === 'address' && address ? { address } : {})
      };

      await notesApi.create(currentOrganization._id, noteData);
      setNewNote('');
      
      // Refresh notes
      await fetchNotes();
      
      // Recalculate unseen count after adding note
      // if (currentUser && currentUser._id && currentOrganization && (transactionId || address)) {
      //   const contextId = getContextId(transactionId, address);
      //   if (contextId) {
      //     try {
      //       const response = await notesApi.getUnseenCount(
      //         currentOrganization._id,
      //         type,
      //         contextId
      //       );
      //       setUnseenNotesCount(response.data.count);
      //     } catch (error) {
      //       if (process.env.NODE_ENV === 'development') console.error('Failed to recalculate unseen count:', error);
      //     }
      //   }
      // }
      
      message.success('Note added successfully');
    } catch (error) {
      if (process.env.NODE_ENV === 'development') console.error('Failed to add note:', error);
      message.error('Failed to add note');
    } finally {
      setSubmitting(false);
    }
  };

  // Format date/time helpers
  const formatDate = (dateString: string) => new Date(dateString).toLocaleString();
  
  const formatDateHeader = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === now.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    
    return date.toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const isCurrentUserNote = (note: INote) => 
    currentUser && (note.createdBy === currentUser._id || ('id' in currentUser && note.createdBy === currentUser.id));
  
  const getModalTitle = () => {
    if ((type as string) === 'transaction' && transactionId) return `Transaction Notes - ${truncateAddress(transactionId)}`;
    if ((type as string) === 'address' && address) {
      const noteTypeLabel = noteType === 'cluster' ? 'Cluster' : 'Address';
      const identifier = noteType === 'cluster' && cospendId ? cospendId : address;
      return `${noteTypeLabel} Notes - ${truncateAddress(identifier)}`;
    }
    return 'Organization Notes';
  };

  const handleCopyClusterId = () => {
    if (cospendId) {
      navigator.clipboard.writeText(cospendId);
      message.success('Cluster ID copied to clipboard');
    }
  };

  // Group notes by date for chat headers
  const groupNotesByDate = () => {
    const groups: { [key: string]: INote[] } = {};
    notes.forEach(note => {
      const date = new Date(note.createdAt).toDateString();
      if (!groups[date]) groups[date] = [];
      groups[date].push(note);
    });
    
    // Sort notes within each date group by creation time (oldest to newest)
    Object.keys(groups).forEach(date => {
      groups[date].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    });
    
    return groups;
  };

  // Check if user is the owner of a note
  const isNoteOwner = (note: INote) => 
    currentUser && (note.createdBy === currentUser._id || ('id' in currentUser && note.createdBy === currentUser.id));

  // Handle edit note
  const handleEditNote = (note: INote) => {
    setEditingNoteId(note._id);
    setEditContent(note.content);
  };

  // Cancel edit mode
  const cancelEdit = () => {
    setEditingNoteId(null);
    setEditContent('');
  };

  // Save edited note
  const saveEdit = async () => {
    if (!editContent.trim() || !currentOrganization || !editingNoteId) return;
    
    try {
      setSubmitting(true);
      
      // Simplified update with just content
      await notesApi.update(currentOrganization._id, editingNoteId, {
        content: editContent.trim()
      });
      
      // Refresh notes to get the updated version
      fetchNotes();
      
      setEditingNoteId(null);
      setEditContent('');
      message.success('Note updated successfully');
    } catch (error: any) {
      message.error('Failed to update note');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete note
  const deleteNote = async (noteId: string) => {
    if (!currentOrganization) return;

    try {
      // Simplified delete without extra parameters
      await notesApi.delete(currentOrganization._id, noteId);
      
      // Refresh notes after deletion
      fetchNotes();
      message.success('Note deleted successfully');
    } catch (error: any) {
      message.error('Failed to delete note');
    }
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <span className= "text-foreground">{getModalTitle()}</span>
          {noteType === 'cluster' && cospendId && (
            <button
              onClick={handleCopyClusterId}
              className="bg-transparent border-none cursor-pointer p-1 flex items-center text-muted-foreground hover:text-foreground rounded transition-colors hover:bg-muted"
              title="Copy cluster ID"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
            </button>
          )}
        </div>
      }
      open={visible}
      onClose={onClose}
      size="lg"
    >
      <div className="text-foreground">
        {!currentOrganization ? (
          <div className="text-warning-foreground bg-warning/10 border border-warning/20 rounded-md p-3">
            You need to be part of an organization to use notes.
          </div>
        ) : (
          <>
            {/* Note Type Toggle - only show for address type */}
            {(type as string) === 'address' && cospendId && (
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg mb-4 border border-border">
                <span className="text-xs font-medium text-muted-foreground">
                  Notes for:
                </span>
                <div className="flex bg-background rounded-md p-0.5">
                  <button
                    onClick={() => setNoteType('address')}
                    className={`px-2 py-1 text-xs rounded transition-all ${
                      noteType === 'address' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Address
                  </button>
                  <button
                    onClick={() => setNoteType('cluster')}
                    disabled={!cospendId}
                    className={`px-2 py-1 text-xs rounded transition-all ${
                      noteType === 'cluster' 
                        ? 'bg-primary text-primary-foreground' 
                        : !cospendId 
                          ? 'text-muted-foreground/50 cursor-not-allowed' 
                          : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Cluster {!cospendId && '(N/A)'}
                  </button>
                </div>
              </div>
            )}
            
            <NotesContainer ref={notesContainerRef}>
              {loading ? (
                <div className="text-center p-5">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : notes.length === 0 ? (
                <div className="text-muted-foreground text-center p-4">No notes yet. Be the first to add a note!</div>
              ) : (
                <>
                  {Object.entries(groupNotesByDate())
                    .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())
                    .map(([date, dateNotes], index) => (
                    <React.Fragment key={date}>
                      <div className={`text-center text-xs text-muted-foreground ${index === 0 ? '-mt-1 mb-2' : 'mt-4 mb-2'}`}>
                        <span className="bg-muted px-3 py-1 rounded-full">
                          {formatDateHeader(date)}
                        </span>
                      </div>
                      {dateNotes.map(note => (
                        editingNoteId === note._id ? (
                          <CurrentUserNote key={note._id} themeMode={theme}>
                            <div>
                              <Textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                rows={2}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    saveEdit();
                                  } else if (e.key === 'Escape') {
                                    cancelEdit();
                                  }
                                }}
                                autoFocus
                                className="bg-transparent border-border text-foreground placeholder:text-muted-foreground hover:border-ring focus:border-ring focus:ring-2 focus:ring-ring/20"
                              />
                              <div className="flex justify-end gap-2 mt-2">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={cancelEdit}
                                >
                                  Cancel
                                </Button>
                                <Button 
                                  size="sm" 
                                  onClick={saveEdit}
                                  disabled={!editContent.trim()}
                                >
                                  Save
                                </Button>
                              </div>
                            </div>
                          </CurrentUserNote>
                        ) : (
                          isCurrentUserNote(note) ? (
                            <CurrentUserNote key={note._id} themeMode={theme}>
                              {isNoteOwner(note) && (
                                <ActionIcons themeMode={theme}>
                                  <ActionIcon themeMode={theme} onClick={() => handleEditNote(note)}>
                                    <Edit className="h-3 w-3" />
                                  </ActionIcon>
                                  <ActionIcon themeMode={theme} onClick={() => {
                                    if (window.confirm('Delete this note?')) {
                                      deleteNote(note._id);
                                    }
                                  }}>
                                    <Delete className="h-3 w-3" />
                                  </ActionIcon>
                                </ActionIcons>
                              )}
                              <NoteContent>{note.content}</NoteContent>
                              <NoteFooter themeMode={theme}>
                                <span>By: {currentUser ? `${currentUser.name} ${currentUser.surname}` : (note.creatorName || note.createdBy)}</span>
                                <span>{formatDate(note.createdAt)}</span>
                              </NoteFooter>
                            </CurrentUserNote>
                          ) : (
                            <OtherUserNote key={note._id} themeMode={theme}>
                              <NoteContent>{note.content}</NoteContent>
                              <NoteFooter themeMode={theme}>
                                <span>By: {note.creatorName || note.createdBy}</span>
                                <span>{formatDate(note.createdAt)}</span>
                              </NoteFooter>
                            </OtherUserNote>
                          )
                        )
                      ))}
                    </React.Fragment>
                  ))}
                </>
              )}
            </NotesContainer>

            <div className="flex items-center gap-2 mt-2 p-2">
              <Input
                placeholder="Add a note..."
                value={newNote}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewNote(e.target.value)}
                onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleAddNote())}
                disabled={submitting}
                variant="outline"
                size="sm"
                className="flex-1 rounded-full"
              />
              <Button
                onClick={handleAddNote}
                disabled={!newNote.trim() || submitting}
                size="sm"
                className="bg-[#A53D10] hover:bg-[#C74D1B] text-white border-none h-8 w-8 p-0"
              >
                {submitting ? (
                  <div className="inline-block animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                ) : (
                  <ArrowRight className="h-3 w-3" />
                )}
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

export default NotesModal; 