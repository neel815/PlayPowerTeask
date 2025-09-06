import { useState, useEffect } from 'react';
import RichTextEditor from '../RichTextEditor/RichTextEditor';
import encryptionService from '../../services/encryptionService';
import { MdLock, MdLockOpen } from 'react-icons/md';
import './NoteEditor.css';

const NoteEditor = ({ note, onSave, onAIAnalysis, onDelete }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [isEncrypted, setIsEncrypted] = useState(false);
  const [password, setPassword] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      const noteIsEncrypted = encryptionService.isEncrypted(note.content);
      setIsEncrypted(noteIsEncrypted);
      
      if (noteIsEncrypted) {
        // Show password modal immediately for encrypted notes
        setShowPasswordModal(true);
        setContent(''); // Don't show encrypted content
      } else {
        setContent(note.content);
      }
      
      setIsPinned(note.isPinned || false);
      setPassword('');
      setPasswordError('');
    }
  }, [note]);

  const handleSave = () => {
    let savedContent = content;
    if (isEncrypted && password) {
      savedContent = encryptionService.encryptNote(content, password);
    }
    
    const noteData = {
      id: note?.id || Date.now(),
      title,
      content: savedContent,
      isPinned,
      lastModified: new Date().toISOString(),
      isEncrypted
    };
    onSave(noteData);
  };

  const handleAIAnalysis = async () => {
    if (content.trim()) {
      onAIAnalysis(content);
    }
  };

  const handleDelete = () => {
    if (note?.id) {
      const noteTitle = title || 'Untitled Note';
      if (window.confirm(`Are you sure you want to delete "${noteTitle}"? This action cannot be undone.`)) {
        onDelete(note.id);
      }
    }
  };

  const toggleEncryption = () => {
    if (isEncrypted) {
      // Unlocking note
      if (encryptionService.isEncrypted(content)) {
        setShowPasswordModal(true);
      } else {
        setIsEncrypted(false);
        setPassword('');
      }
    } else {
      // Locking note
      setShowPasswordModal(true);
    }
  };

  const handlePasswordSubmit = () => {
    if (!password) {
      setPasswordError('Password is required');
      return;
    }

    if (!isEncrypted) {
      // Encrypting the note
      setIsEncrypted(true);
      setShowPasswordModal(false);
      setPasswordError('');
    } else {
      // Trying to decrypt the note
      try {
        const decryptedContent = encryptionService.decryptNote(note.content, password);
        if (decryptedContent === note.content) {
          // Wrong password - decryption didn't work
          setPasswordError('Invalid password');
          return;
        }
        setContent(decryptedContent);
        setShowPasswordModal(false);
        setPasswordError('');
      } catch (error) {
        setPasswordError('Invalid password');
        return;
      }
    }
  };

  return (
    <div className="note-editor">
      <div className="note-header">
        <div className="title-container">
          <input
            type="text"
            placeholder="Enter note title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="title-input"
          />
          <button
            className={`pin-button ${isPinned ? 'pinned' : ''}`}
            onClick={() => setIsPinned(!isPinned)}
            title={isPinned ? "Unpin note" : "Pin note"}
          >
            📌
          </button>
          <button
            className={`encrypt-button ${isEncrypted ? 'encrypted' : ''}`}
            onClick={toggleEncryption}
            title={isEncrypted ? "Unlock note" : "Lock note with password"}
          >
            {isEncrypted ? <MdLock size={20} /> : <MdLockOpen size={20} />}
          </button>
        </div>
        <div className="note-meta">
          {note?.lastModified && (
            <span className="last-modified">
              Last edited: {new Date(note.lastModified).toLocaleString()}
            </span>
          )}
          {isEncrypted && <span className="encrypted-badge">Encrypted</span>}
        </div>
      </div>
      
      {showPasswordModal && (
        <div className="password-modal">
          <div className="password-modal-content">
            <h3>{isEncrypted ? "Unlock Note" : "Set Password"}</h3>
            <input
              type="password"
              placeholder={isEncrypted ? "Enter password to unlock" : "Enter password to encrypt"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="password-input"
            />
            {passwordError && <div className="password-error">{passwordError}</div>}
            <div className="password-modal-actions">
              <button onClick={() => {
                setShowPasswordModal(false);
                setPasswordError('');
              }}>Cancel</button>
              <button onClick={handlePasswordSubmit} className="submit-password">
                {isEncrypted ? "Unlock" : "Set Password"}
              </button>
            </div>
          </div>
        </div>
      )}
      <RichTextEditor 
        value={content} 
        onChange={setContent}
        noteId={note?.id}
      />
      
      <div className="editor-actions">
        <button 
          onClick={handleSave} 
          className="save-button"
          title="Save note"
        >
          Save
        </button>
        {note?.id && (
          <button 
            onClick={handleDelete} 
            className="delete-button"
            title="Delete note"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
};

export default NoteEditor;
