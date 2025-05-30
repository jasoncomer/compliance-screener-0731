import React, { useState, useEffect, useRef } from 'react';
import { Modal, Button, Input, Typography, Spin, message as antMessage, Popconfirm } from 'antd';
import styled from 'styled-components';
import { useTheme } from '../../context/ThemeContext';
import { colors } from '../../styles/variables';
import { INote, ICreateNote, notesApi } from '../../api/notes';
import { useSelector } from 'react-redux';
import { selectCurrentOrganization } from '../../store/slices/organizationsSlice';
import { truncateAddress } from '../../utils/crypto';
import { SendOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useAppContext } from '../../context/AppContext';

const { Text } = Typography;

interface ThemeProps {
  themeMode: string;
}

// Base styles for note bubbles
const NoteItemBase = styled.div<ThemeProps>`
  padding: 12px 16px;
  margin-bottom: 10px;
  border-radius: 12px;
  max-width: 85%;
  position: relative;
`;

// Note from current user (right-aligned)
const CurrentUserNote = styled(NoteItemBase)`
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
const OtherUserNote = styled(NoteItemBase)`
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
const ActionIcons = styled.div<ThemeProps>`
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

const ActionIcon = styled.div<ThemeProps>`
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

const NoteFooter = styled.div<ThemeProps>`
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: ${({ themeMode }) => themeMode === 'dark' ? '#bbb' : '#666'};
`;

const NotesContainer = styled.div`
  max-height: 350px;
  overflow-y: auto;
  margin-bottom: 16px;
  padding: 0 8px;
  
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

const ChatDate = styled.div`
  text-align: center;
  margin: 16px 0 8px;
  font-size: 12px;
  color: ${({ theme }) => theme.theme === 'dark' ? '#aaa' : '#666'};
  
  span {
    background-color: ${({ theme }) => theme.theme === 'dark' ? '#333' : '#eee'};
    padding: 4px 10px;
    border-radius: 12px;
  }
`;

const InputContainer = styled.div<ThemeProps>`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  background: ${({ themeMode }) => themeMode === 'dark' ? '#1f1f1f' : '#ffffff'};
  border-radius: 8px;
  padding: 8px;
`;

const SendButton = styled(Button)`
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #A53D10;
  border-color: #A53D10;
  
  &:hover, &:focus {
    background-color: #C74D1B;
    border-color: #C74D1B;
  }
`;

const StyledInput = styled(Input)`
  border-radius: 18px;
`;

interface NotesModalProps {
  visible: boolean;
  onClose: () => void;
  transactionId?: string;
  address?: string;
  type?: 'general' | 'transaction' | 'address';
}

// Custom message utility that respects theme context
const useCustomMessage = () => {
  const { theme } = useTheme();
  
  // Create themed message API handlers
  const message = {
    success: (content: string) => {
      antMessage.success({
        content,
        className: `message-${theme}`
      });
    },
    error: (content: string) => {
      antMessage.error({
        content,
        className: `message-${theme}`
      });
    },
    warning: (content: string) => {
      antMessage.warning({
        content,
        className: `message-${theme}`
      });
    },
    info: (content: string) => {
      antMessage.info({
        content,
        className: `message-${theme}`
      });
    }
  };
  
  return message;
};

const NotesModal: React.FC<NotesModalProps> = ({ 
  visible, 
  onClose, 
  transactionId,
  address, 
  type = 'general' 
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

  // Load notes when modal opens
  useEffect(() => {
    if (visible && currentOrganization) fetchNotes();
  }, [visible, currentOrganization, transactionId, address, type]);

  // Fetch notes from API
  const fetchNotes = async () => {
    if (!currentOrganization) return;
    
    try {
      setLoading(true);
      let response;

      if (type === 'transaction' && transactionId) {
        response = await notesApi.getTransactionNotes(currentOrganization._id, transactionId);
      } else if (type === 'address' && address) {
        response = await notesApi.getAddressNotes(currentOrganization._id, address);
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
        type,
        ...(type === 'transaction' && transactionId ? { transactionId } : {}),
        ...(type === 'address' && address ? { address } : {})
      };

      await notesApi.create(currentOrganization._id, noteData);
      setNewNote('');
      fetchNotes();
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
    if (type === 'transaction' && transactionId) return `Transaction Notes - ${truncateAddress(transactionId)}`;
    if (type === 'address' && address) return `Address Notes - ${truncateAddress(address)}`;
    return 'Organization Notes';
  };

  // Group notes by date for chat headers
  const groupNotesByDate = () => {
    const groups: { [key: string]: INote[] } = {};
    notes.forEach(note => {
      const date = new Date(note.createdAt).toDateString();
      if (!groups[date]) groups[date] = [];
      groups[date].push(note);
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
      title={getModalTitle()}
      open={visible}
      onCancel={onClose}
      footer={null}
      width={500}
    >
      <div style={{ color: theme === 'light' ? colors.black : colors.white }}>
        {!currentOrganization ? (
          <Text type="warning">You need to be part of an organization to use notes.</Text>
        ) : (
          <>
            <NotesContainer ref={notesContainerRef}>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '20px' }}><Spin /></div>
              ) : notes.length === 0 ? (
                <Text type="secondary">No notes yet. Be the first to add a note!</Text>
              ) : (
                <>
                  {Object.entries(groupNotesByDate()).map(([date, dateNotes]) => (
                    <React.Fragment key={date}>
                      <ChatDate theme={{ theme }}><span>{formatDateHeader(date)}</span></ChatDate>
                      {dateNotes.map(note => (
                        editingNoteId === note._id ? (
                          <CurrentUserNote key={note._id} themeMode={theme}>
                            <div>
                              <Input.TextArea
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
                              />
                              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                                <Button size="small" onClick={cancelEdit}>
                                  Cancel
                                </Button>
                                <Button 
                                  size="small" 
                                  type="primary" 
                                  onClick={saveEdit}
                                  disabled={!editContent.trim()}
                                  style={{ backgroundColor: '#A53D10', borderColor: '#A53D10' }}
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
                                    <EditOutlined style={{ fontSize: '12px' }} />
                                  </ActionIcon>
                                  <Popconfirm
                                    title="Delete this note?"
                                    onConfirm={() => deleteNote(note._id)}
                                    okText="Yes"
                                    cancelText="No"
                                    placement="left"
                                    okButtonProps={{ style: { backgroundColor: '#A53D10', borderColor: '#A53D10' } }}
                                  >
                                    <ActionIcon themeMode={theme}>
                                      <DeleteOutlined style={{ fontSize: '12px' }} />
                                    </ActionIcon>
                                  </Popconfirm>
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

            <InputContainer themeMode={theme}>
              <StyledInput
                placeholder="Add a note..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleAddNote())}
                disabled={submitting}
              />
              <SendButton
                type="primary"
                icon={<SendOutlined />}
                onClick={handleAddNote}
                loading={submitting}
                disabled={!newNote.trim()}
              />
            </InputContainer>
          </>
        )}
      </div>
    </Modal>
  );
};

export default NotesModal; 