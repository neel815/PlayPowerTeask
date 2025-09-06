// Browser Storage Service - Pure Frontend Storage
// No database, only browser localStorage

const STORAGE_KEYS = {
  NOTES: 'playpower-notes',
  SELECTED_NOTE: 'playpower-selectedNote'
};

// Save notes to browser localStorage
export const saveNotesToBrowser = (notes) => {
  try {
    localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes));
    console.log(`✅ Saved ${notes.length} notes to browser storage`);
    return true;
  } catch (error) {
    console.error('❌ Failed to save notes to browser storage:', error);
    return false;
  }
};

// Load notes from browser localStorage
export const loadNotesFromBrowser = () => {
  try {
    const savedNotes = localStorage.getItem(STORAGE_KEYS.NOTES);
    if (savedNotes) {
      const notes = JSON.parse(savedNotes);
      if (Array.isArray(notes)) {
        console.log(`✅ Loaded ${notes.length} notes from browser storage`);
        return notes;
      }
    }
    console.log('📝 No notes found in browser storage');
    return [];
  } catch (error) {
    console.error('❌ Failed to load notes from browser storage:', error);
    return [];
  }
};

// Save selected note to browser localStorage
export const saveSelectedNoteToBrowser = (selectedNote) => {
  try {
    if (selectedNote) {
      localStorage.setItem(STORAGE_KEYS.SELECTED_NOTE, JSON.stringify(selectedNote));
    } else {
      localStorage.removeItem(STORAGE_KEYS.SELECTED_NOTE);
    }
    return true;
  } catch (error) {
    console.error('❌ Failed to save selected note to browser storage:', error);
    return false;
  }
};

// Load selected note from browser localStorage
export const loadSelectedNoteFromBrowser = () => {
  try {
    const savedSelectedNote = localStorage.getItem(STORAGE_KEYS.SELECTED_NOTE);
    if (savedSelectedNote) {
      const selectedNote = JSON.parse(savedSelectedNote);
      console.log('✅ Loaded selected note from browser storage');
      return selectedNote;
    }
    return null;
  } catch (error) {
    console.error('❌ Failed to load selected note from browser storage:', error);
    return null;
  }
};

// Clear all notes from browser storage
export const clearAllNotesFromBrowser = () => {
  try {
    localStorage.removeItem(STORAGE_KEYS.NOTES);
    localStorage.removeItem(STORAGE_KEYS.SELECTED_NOTE);
    console.log('🗑️ Cleared all notes from browser storage');
    return true;
  } catch (error) {
    console.error('❌ Failed to clear notes from browser storage:', error);
    return false;
  }
};

// Get storage info
export const getStorageInfo = () => {
  try {
    const notes = localStorage.getItem(STORAGE_KEYS.NOTES);
    const selectedNote = localStorage.getItem(STORAGE_KEYS.SELECTED_NOTE);
    
    return {
      hasNotes: !!notes,
      notesCount: notes ? JSON.parse(notes).length : 0,
      hasSelectedNote: !!selectedNote,
      storageSize: (notes?.length || 0) + (selectedNote?.length || 0)
    };
  } catch (error) {
    console.error('❌ Failed to get storage info:', error);
    return {
      hasNotes: false,
      notesCount: 0,
      hasSelectedNote: false,
      storageSize: 0
    };
  }
};
