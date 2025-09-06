import { useState, useEffect } from 'react';
import encryptionService from '../../services/encryptionService';
import './NotesList.css';

const NotesList = ({ notes, onSelectNote, onDeleteNote, searchQuery }) => {
  const [filteredNotes, setFilteredNotes] = useState([]);

  useEffect(() => {
    const filtered = notes.filter(note => {
      const searchLower = searchQuery.toLowerCase();
      return (
        note.title.toLowerCase().includes(searchLower) ||
        note.content.toLowerCase().includes(searchLower)
      );
    });

    // Sort notes: pinned first, then by last modified date
    const sorted = [...filtered].sort((a, b) => {
      if (a.isPinned !== b.isPinned) return b.isPinned ? 1 : -1;
      return new Date(b.lastModified) - new Date(a.lastModified);
    });

    setFilteredNotes(sorted);
  }, [notes, searchQuery]);

  return (
    <div className="notes-list">
      {filteredNotes.map(note => (
        <div key={note.id} className="note-item">
          <div className="note-item-content" onClick={() => onSelectNote(note)}>
            {note.isPinned && <span className="pin-indicator">📌</span>}
            <h3 className="note-title">
              {note.title || 'Untitled'}
              {encryptionService.isEncrypted(note.content) && <span className="encrypted-indicator">LOCKED</span>}
            </h3>
            <p className="note-preview">
              {encryptionService.isEncrypted(note.content) 
                ? "This note is encrypted" 
                : note.content.replace(/<[^>]+>/g, '').slice(0, 100) + (note.content.replace(/<[^>]+>/g, '').length > 100 ? '...' : '')
              }
            </p>
            <span className="note-date">
              {new Date(note.lastModified).toLocaleDateString()}
            </span>
          </div>
          <button
            className="delete-button"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteNote(note.id);
            }}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};

export default NotesList;
