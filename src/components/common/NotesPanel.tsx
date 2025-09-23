import React, { useEffect, useRef,useState } from 'react';

import { CheckOutlined, CloseOutlined,DeleteOutlined, EditOutlined, SendOutlined } from '@ant-design/icons';
import { Input, List, message, Popconfirm,Spin, Typography } from 'antd';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { ICreateNote, INote, notesApi } from '../../api/notes';
import { useAppContext } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import { selectCurrentOrganization } from '../../store/slices/organizationsSlice';

const { TextArea } = Input;
const { Text } = Typography;

const PanelContainer = styled.div<{ $themeMode: string; $expanded: boolean }>`
  position: fixed;
  top: 70px;
  right: 20px;
  width: 450px;
  max-height: ${props => props.$expanded ? '400px' : '95px'};
  display: flex;
  flex-direction: column;
  background: ${({ $themeMode }) => $themeMode === 'dark' ? '#1f1f1f' : '#ffffff'};
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 100;
  overflow: hidden;
  transition: max-height 0.3s ease;
`;

const NoteItem = styled.div<{ $themeMode: string; $isLatest?: boolean; $isEditing?: boolean }>`
  padding: 8px 12px;
  border-bottom: 1px solid ${({ $themeMode }) => $themeMode === 'dark' ? '#303030' : '#f0f0f0'};
  position: relative;
  
  &:last-child { border-bottom: none; }
  &:first-child {
    border-top-left-radius: 8px;
    border-top-right-radius: 8px;
    padding-top: 10px;
  }
  ${props => props.$isEditing && `
    background-color: ${props.$themeMode === 'dark' ? '#2a2a2a' : '#f9f9f9'};
  `}
`;

const NoteContent = styled.div`
  margin-bottom: 4px;
  white-space: pre-wrap;
  font-size: 13px;
  padding-right: 50px;
`;

const NoteFooter = styled.div<{ $themeMode: string }>`
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: ${({ $themeMode }) => $themeMode === 'dark' ? '#999' : '#666'};
`;

const ActionIcons = styled.div<{ $themeMode: string }>`
  position: absolute;
  top: 6px;
  right: 8px;
  display: flex;
  gap: 6px;
  opacity: 0;
  transition: opacity 0.2s ease;
  ${NoteItem}:hover & { opacity: 1; }
`;

const ActionIcon = styled.div<{ $themeMode: string }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 4px;
  cursor: pointer;
  &:hover { background-color: ${({ $themeMode }) => $themeMode === 'dark' ? '#444' : '#eee'}; }
`;

const EditActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
`;

const NotesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  
  &::-webkit-scrollbar {
    width: 4px;
    &-track { background: transparent; }
    &-thumb { 
      background: #888; 
      border-radius: 4px;
      &:hover { background: #555; }
    }
  }

  .ant-list {
    border-radius: 8px 8px 0 0;
    overflow: hidden;
  }
`;

const InputContainer = styled.div<{ $themeMode: string }>`
  padding: 6px 8px;
  border-top: 1px solid ${({ $themeMode }) => $themeMode === 'dark' ? '#303030' : '#f0f0f0'};
  display: flex;
  align-items: center;
  background: ${({ $themeMode }) => $themeMode === 'dark' ? '#1f1f1f' : '#ffffff'};
`;

const CompactInput = styled(Input)`
  border-radius: 16px;
  font-size: 13px;
  &.ant-input { padding: 4px 12px; }
`;

const SendButton = styled.div<{ $themeMode: string; $disabled: boolean }>`
  display: flex;
  justify-content: center;
  align-items: center;
  color: ${({ $themeMode, $disabled }) => 
    $disabled ? ($themeMode === 'dark' ? '#555' : '#ccc') : '#C74D1B'};
  cursor: ${({ $disabled }) => $disabled ? 'not-allowed' : 'pointer'};
  width: 32px;
  height: 32px;
  border-radius: 50%;
  margin-left: 8px;
  
  &:hover {
    background: ${({ $themeMode, $disabled }) => 
      $disabled ? 'transparent' : ($themeMode === 'dark' ? '#333' : '#f0f0f0')};
  }
`;

const NoNotesMessage = styled(Text)`
  display: block;
  padding: 8px 12px;
  text-align: center;
  font-size: 13px;
`;

interface NotesPanelProps {
  transactionId?: string;
  address?: string;
  type?: 'general' | 'transaction' | 'address';
}

const NotesPanel: React.FC<NotesPanelProps> = ({ transactionId, address, type = 'general' }) => {
  const { theme } = useTheme();
  const { user: currentUser } = useAppContext();
  const [notes, setNotes] = useState<INote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const notesContainerRef = useRef<HTMLDivElement>(null);
  const currentOrganization = useSelector(selectCurrentOrganization);

  // Initial fetch of notes
  useEffect(() => {
    if (currentOrganization) fetchNotes();
  }, [currentOrganization, transactionId, address, type]);

  // Keep scrolled to top to show most recent note
  useEffect(() => {
    if (notes.length > 0 && notesContainerRef.current) {
      notesContainerRef.current.scrollTop = 0;
    }
  }, [notes]);

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

  const handleEditNote = (note: INote) => {
    setEditingNoteId(note._id);
    setEditContent(note.content);
    setExpanded(true); // Expand when editing
  };

  const cancelEdit = () => {
    setEditingNoteId(null);
    setEditContent('');
  };

  const saveEdit = async () => {
    if (!editContent.trim() || !currentOrganization || !editingNoteId) return;
    
    try {
      setSubmitting(true);
      
      // Simplified update with just content
      await notesApi.update(currentOrganization._id, editingNoteId, {
        content: editContent.trim()
      });
      
      setEditingNoteId(null);
      setEditContent('');
      fetchNotes();
      message.success('Note updated successfully');
    } catch (error) {
      message.error('Failed to update note');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteNote = async (noteId: string) => {
    if (!currentOrganization) return;

    try {
      // Simplified delete without extra parameters
      await notesApi.delete(currentOrganization._id, noteId);
      
      fetchNotes();
      message.success('Note deleted successfully');
    } catch (error: any) {
      message.error('Failed to delete note');
    }
  };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleString();

  // Check if user is the owner of a note
  const isNoteOwner = (note: INote) => 
    currentUser && (note.createdBy === currentUser._id || ('id' in currentUser && note.createdBy === currentUser.id));

  const handleContainerClick = (e: React.MouseEvent) => {
    // Don't toggle expand/collapse when clicking action buttons or edit form
    if (
      !(e.target as HTMLElement).closest('.action-icons') && 
      !(e.target as HTMLElement).closest('.edit-form')
    ) {
      setExpanded(!expanded);
    }
  };

  return (
    <PanelContainer $themeMode={theme} $expanded={expanded}>      
      <NotesContainer 
        ref={notesContainerRef} 
        id="notes-container" 
        onClick={handleContainerClick}
      >
        {loading ? (
          <div style={{ textAlign: 'center', padding: '8px' }}><Spin size="small" /></div>
        ) : notes.length === 0 ? (
          <NoNotesMessage type="secondary">No notes yet</NoNotesMessage>
        ) : (
          <List
            dataSource={notes}
            renderItem={(note, index) => (
              <NoteItem 
                $themeMode={theme}
                $isLatest={index === 0}
                $isEditing={editingNoteId === note._id}
              >
                {editingNoteId === note._id ? (
                  <div className="edit-form">
                    <TextArea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={2}
                      allowClear={false}
                      showCount={false}
                      count={undefined}
                      onClear={undefined}
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
                    <EditActions>
                      <button 
                        className="ant-btn ant-btn-sm" 
                        onClick={cancelEdit}
                      >
                        <CloseOutlined /> Cancel
                      </button>
                      <button 
                        className="ant-btn ant-btn-sm ant-btn-primary"
                        onClick={saveEdit}
                        disabled={!editContent.trim()}
                        style={{ backgroundColor: '#C74D1B', borderColor: '#C74D1B' }}
                      >
                        <CheckOutlined /> Save
                      </button>
                    </EditActions>
                  </div>
                ) : (
                  <>
                    {isNoteOwner(note) && (
                      <ActionIcons $themeMode={theme} className="action-icons">
                        <ActionIcon 
                          $themeMode={theme}
                          onClick={() => handleEditNote(note)}
                        >
                          <EditOutlined style={{ fontSize: '12px' }} />
                        </ActionIcon>
                        <Popconfirm
                          title="Delete this note?"
                          onConfirm={() => deleteNote(note._id)}
                          okText="Yes"
                          cancelText="No"
                          placement="left"
                          okButtonProps={{ style: { backgroundColor: '#C74D1B', borderColor: '#C74D1B' } }}
                        >
                          <ActionIcon $themeMode={theme}>
                            <DeleteOutlined style={{ fontSize: '12px' }} />
                          </ActionIcon>
                        </Popconfirm>
                      </ActionIcons>
                    )}
                    <NoteContent>{note.content}</NoteContent>
                    <NoteFooter $themeMode={theme}>
                      <span>By: {note.creatorName || note.createdBy}</span>
                      <span>{formatDate(note.createdAt)}</span>
                    </NoteFooter>
                  </>
                )}
              </NoteItem>
            )}
          />
        )}
      </NotesContainer>

      {currentOrganization && (
        <InputContainer $themeMode={theme}>
          <CompactInput
            placeholder="Add a note..."
            value={newNote}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewNote(e.target.value)}
            onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleAddNote())}
            disabled={submitting}
          />
          <SendButton 
            $themeMode={theme} 
            $disabled={submitting || !newNote.trim()}
            onClick={newNote.trim() ? handleAddNote : undefined}
          >
            <SendOutlined />
          </SendButton>
        </InputContainer>
      )}
    </PanelContainer>
  );
};

export default NotesPanel; 