import { useState, useEffect } from 'react';
import NoteEditor from './components/NoteEditor/NoteEditor';
import NotesList from './components/NotesList/NotesList';
import AIAnalysis from './components/AIAnalysis/AIAnalysis';
import textAnalysisService from './services/textAnalysis';
import encryptionService from './services/encryptionService';
import { 
  saveNotesToBrowser, 
  loadNotesFromBrowser, 
  saveSelectedNoteToBrowser, 
  loadSelectedNoteFromBrowser 
} from './services/browserStorage';
import './App.css';

function App() {
  const [notes, setNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [pendingNote, setPendingNote] = useState(null);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [lastSaved, setLastSaved] = useState(null);

  const handleAIAnalysis = async (content) => {
    try {
      const result = await textAnalysisService.analyzeText(content);
      setAiAnalysis(result);
    } catch (error) {
      console.error('AI Analysis failed:', error);
    }
  };

  const handleCloseAIAnalysis = () => {
    setAiAnalysis(null);
  };

  const handleNoteSelection = (note) => {
    // Check if the note is encrypted
    if (encryptionService.isEncrypted(note.content)) {
      // Show password prompt for encrypted notes
      setPendingNote(note);
      setShowPasswordPrompt(true);
      setPassword('');
      setPasswordError('');
    } else {
      // Directly select non-encrypted notes
      setSelectedNote(note);
    }
  };

  const handlePasswordSubmit = () => {
    if (!password) {
      setPasswordError('Password is required');
      return;
    }

    if (!pendingNote) {
      setPasswordError('No note selected');
      return;
    }

    try {
      // Try to decrypt the note
      const decryptedContent = encryptionService.decryptNote(pendingNote.content, password);
      
      // Check if decryption was successful (content should change)
      if (decryptedContent === pendingNote.content) {
        setPasswordError('Invalid password');
        return;
      }

      // Create a temporary note with decrypted content for editing
      const decryptedNote = {
        ...pendingNote,
        content: decryptedContent,
        isEncrypted: true // Keep track that this note is encrypted
      };

      setSelectedNote(decryptedNote);
      setShowPasswordPrompt(false);
      setPendingNote(null);
      setPassword('');
      setPasswordError('');
    } catch (error) {
      setPasswordError('Invalid password');
    }
  };

  const handlePasswordCancel = () => {
    setShowPasswordPrompt(false);
    setPendingNote(null);
    setPassword('');
    setPasswordError('');
  };

  // Load notes from browser storage on app start
  useEffect(() => {
    // Check for shared note in URL
    const urlParams = new URLSearchParams(window.location.search);
    const sharedId = urlParams.get('shared');
    
    if (sharedId) {
      // Try to load shared note from sessionStorage
      const sharedNoteData = sessionStorage.getItem(`shared_note_${sharedId}`);
      if (sharedNoteData) {
        try {
          const noteData = JSON.parse(sharedNoteData);
          const sharedNote = {
            id: noteData.shareId,
            title: noteData.title,
            content: noteData.content,
            isPinned: false,
            lastModified: noteData.timestamp,
            isShared: true
          };
          setSelectedNote(sharedNote);
          // Clear the URL parameter
          window.history.replaceState({}, document.title, window.location.pathname);
        } catch (error) {
          console.error('Error loading shared note:', error);
          alert('Shared note not found or has expired.');
          // Clear the URL parameter
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      } else {
        alert('Shared note not found or has expired.');
        // Clear the URL parameter
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } else {
      // Load notes from browser storage
      const notes = loadNotesFromBrowser();
      const selectedNote = loadSelectedNoteFromBrowser();
      
      setNotes(notes);
      if (selectedNote) {
        setSelectedNote(selectedNote);
      }
    }
  }, []);

  // Auto-save notes to browser storage when they change
  useEffect(() => {
    saveNotesToBrowser(notes);
    if (notes.length > 0) {
      setLastSaved(new Date().toLocaleTimeString());
    }
  }, [notes]);

  // Auto-save selected note to browser storage when it changes
  useEffect(() => {
    saveSelectedNoteToBrowser(selectedNote);
  }, [selectedNote]);

  const handleSaveNote = (noteData) => {
    const noteIndex = notes.findIndex(note => note.id === noteData.id);
    const updatedNoteData = {
      ...noteData,
      lastModified: new Date().toISOString()
    };
    
    let updatedNotes;
    if (noteIndex > -1) {
      // Update existing note
      updatedNotes = [...notes];
      updatedNotes[noteIndex] = updatedNoteData;
    } else {
      // Add new note
      updatedNotes = [...notes, updatedNoteData];
    }
    
    // Update state (auto-save will trigger via useEffect)
    setNotes(updatedNotes);
    setSelectedNote(updatedNoteData);
  };

  const handleDeleteNote = (noteId) => {
    const updatedNotes = notes.filter(note => note.id !== noteId);
    setNotes(updatedNotes); // Auto-save will trigger via useEffect
    
    if (selectedNote?.id === noteId) {
      setSelectedNote(null); // This will also trigger auto-save of selected note
    }
  };

  // const handleAIAnalysis = async (content) => {
  //   // Here you would integrate with your chosen AI API
  //   // For demonstration, we'll simulate AI analysis
  //   const mockAIAnalysis = {
  //     summary: "This is a simulated AI summary of the note content.",
  //     tags: ["sample", "demo", "note"],
  //     terms: {
  //       "example term": "This is a definition of the example term.",
  //     }
  //   };
  //   setAiAnalysis(mockAIAnalysis);
  // };

  return (
    <div className="app">
      <div className="sidebar">
        <div className="sidebar-header">
          <h1>SmartNotes</h1>
          <p>Your Personal Note-Taking App</p>
        </div>
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {lastSaved && (
            <div className="save-status">
              Saved at {lastSaved}
            </div>
          )}
        </div>
        <NotesList
          notes={notes}
          onSelectNote={handleNoteSelection}
          onDeleteNote={handleDeleteNote}
          searchQuery={searchQuery}
        />
        <button 
          className="new-note-btn" 
          onClick={() => {
            const newNote = {
              id: Date.now(),
              title: 'Untitled Note',
              content: '',
              isPinned: false,
              lastModified: new Date().toISOString()
            };
            // Add the new note (auto-save will trigger via useEffect)
            setNotes(prevNotes => [...prevNotes, newNote]);
            setSelectedNote(newNote);
          }}
        >
          + New Note
        </button>
      </div>
      <div className="main-content">
        {selectedNote || notes.length === 0 ? (
          <NoteEditor
            note={selectedNote}
            onSave={handleSaveNote}
            onAIAnalysis={handleAIAnalysis}
            onDelete={handleDeleteNote}
          />
        ) : (
          <div className="no-note-selected">
            <h2>Welcome to SmartNotes!</h2>
            <p>Select a note from the sidebar or create a new one to get started with your note-taking journey.</p>
          </div>
        )}
        {selectedNote && aiAnalysis && (
          <AIAnalysis 
            content={selectedNote.content || ''} 
            analysis={aiAnalysis}
            onClose={handleCloseAIAnalysis}
          />
        )}
      </div>

      {/* Password Prompt Modal */}
      {showPasswordPrompt && (
        <div className="password-modal-overlay">
          <div className="password-modal">
            <div className="password-modal-content">
              <h3>Enter Password</h3>
              <p>This note is encrypted. Please enter the password to access it.</p>
              <input
                type="password"
                placeholder="Enter password..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="password-input"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handlePasswordSubmit();
                  }
                }}
                autoFocus
              />
              {passwordError && <div className="password-error">{passwordError}</div>}
              <div className="password-modal-actions">
                <button onClick={handlePasswordCancel} className="cancel-btn">
                  Cancel
                </button>
                <button onClick={handlePasswordSubmit} className="submit-btn">
                  Unlock Note
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;