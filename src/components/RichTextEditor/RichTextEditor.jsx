import { useRef, useEffect, useState } from "react";
import { MdFormatBold, MdFormatItalic, MdFormatUnderlined, 
         MdFormatAlignLeft, MdFormatAlignCenter, MdFormatAlignRight,
         MdAnalytics, MdClose, MdVolumeUp, MdVolumeOff, MdMic, MdMicOff, MdShare, MdContentCopy } from "react-icons/md";
import "./RichTextEditor.css";
import textAnalysisService from "../../services/textAnalysis";

const RichTextEditor = ({ value, onChange, onAnalysis }) => {
  const editorRef = useRef(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [analysisType, setAnalysisType] = useState('general');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechSynthesis, setSpeechSynthesis] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [speechRecognition, setSpeechRecognition] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [contentSize, setContentSize] = useState({ lines: 0, characters: 0 });

  const analyzeContent = async () => {
    try {
      setLoading(true);
      setError(null);
      const content = editorRef.current.textContent;
      const result = await textAnalysisService.analyzeText(content, analysisType);
      setAnalysis(result);
    } catch (err) {
      setError(err.message);
      console.error('Analysis failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      const selection = window.getSelection();
      let start = 0;
      let end = 0;
      
      // Only try to get selection range if there is a selection
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        start = range.startOffset;
        end = range.endOffset;
      }
      
      editorRef.current.innerHTML = value || '';
      updateContentSize();
      
      // Only try to restore selection if the editor is focused
      if (document.activeElement === editorRef.current && selection) {
        try {
          const newRange = document.createRange();
          const textNode = editorRef.current.firstChild || editorRef.current;
          
          // Ensure we don't exceed the text length
          const length = textNode.textContent.length;
          start = Math.min(start, length);
          end = Math.min(end, length);
          
          newRange.setStart(textNode, start);
          newRange.setEnd(textNode, end);
          selection.removeAllRanges();
          selection.addRange(newRange);
        } catch (e) {
          console.debug('Failed to restore selection:', e);
        }
      }
    }
  }, [value]);

  useEffect(() => {
    // Initialize speech synthesis
    if ('speechSynthesis' in window) {
      setSpeechSynthesis(window.speechSynthesis);
    }

    // Initialize speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        if (finalTranscript) {
          // Insert the recognized text at the current cursor position
          insertTextAtCursor(finalTranscript);
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          alert('Microphone access denied. Please allow microphone access and try again.');
        } else if (event.error === 'no-speech') {
          alert('No speech detected. Please try again.');
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      setSpeechRecognition(recognition);
    }
  }, []);

  const handleTextToSpeech = () => {
    if (!speechSynthesis) {
      alert('Text-to-speech is not supported in this browser.');
      return;
    }

    if (isSpeaking) {
      // Stop speaking
      speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    // Get text content from editor
    const textContent = editorRef.current ? editorRef.current.textContent : '';
    
    if (!textContent.trim()) {
      alert('No text to read. Please add some content to your note.');
      return;
    }

    // Create speech utterance
    const utterance = new SpeechSynthesisUtterance(textContent);
    
    // Configure speech settings
    utterance.rate = 0.9; // Slightly slower for better comprehension
    utterance.pitch = 1;
    utterance.volume = 1;
    
    // Set up event listeners
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    // Start speaking
    speechSynthesis.speak(utterance);
  };

  const insertTextAtCursor = (text) => {
    if (!editorRef.current) return;

    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(document.createTextNode(text + ' '));
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    } else {
      // If no selection, append to the end
      editorRef.current.textContent += text + ' ';
    }

    // Update the content
    const content = editorRef.current.innerHTML;
    onChange(content);
  };

  const handleSpeechToText = () => {
    if (!speechRecognition) {
      alert('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    if (isListening) {
      // Stop listening
      speechRecognition.stop();
      setIsListening(false);
      return;
    }

    // Start listening
    try {
      speechRecognition.start();
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      alert('Error starting speech recognition. Please try again.');
    }
  };

  const generateShareUrl = () => {
    if (!editorRef.current) return;

    const noteContent = editorRef.current.textContent || '';
    const noteTitle = document.querySelector('.title-input')?.value || 'Untitled Note';
    
    if (!noteContent.trim()) {
      alert('Cannot share an empty note. Please add some content first.');
      return;
    }

    // Create a unique share ID
    const shareId = 'shared_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    // Store the note data in sessionStorage (temporary)
    const noteData = {
      title: noteTitle,
      content: noteContent,
      timestamp: new Date().toISOString(),
      shareId: shareId
    };
    
    sessionStorage.setItem(`shared_note_${shareId}`, JSON.stringify(noteData));
    
    // Generate the share URL
    const baseUrl = window.location.origin + window.location.pathname;
    const url = `${baseUrl}?shared=${shareId}`;
    
    setShareUrl(url);
    setShowShareModal(true);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      alert('Share link copied to clipboard!');
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Share link copied to clipboard!');
    }
  };

  const formatText = (command, val = null) => {
    document.execCommand(command, false, val);
    if (editorRef.current) {
      const content = editorRef.current.innerHTML;
      onChange(content);
    }
  };

  const updateContentSize = () => {
    if (editorRef.current) {
      const textContent = editorRef.current.textContent || '';
      const lines = textContent.split('\n').length;
      const characters = textContent.length;
      setContentSize({ lines, characters });
    }
  };

  const handleInput = () => {
    const selection = window.getSelection();
    let start = 0;
    let end = 0;

    // Only try to get selection if there is one
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      start = range.startOffset;
      end = range.endOffset;
    }
    
    const content = editorRef.current.innerHTML;
    onChange(content);
    updateContentSize();
    
    // Only try to restore selection if we have one and the editor is focused
    if (selection && document.activeElement === editorRef.current) {
      requestAnimationFrame(() => {
        try {
          const newRange = document.createRange();
          const textNode = editorRef.current.firstChild || editorRef.current;
          
          // Ensure we don't exceed the text length
          const length = textNode.textContent.length;
          start = Math.min(start, length);
          end = Math.min(end, length);
          
          newRange.setStart(textNode, start);
          newRange.setEnd(textNode, end);
          selection.removeAllRanges();
          selection.addRange(newRange);
        } catch (e) {
          console.debug('Failed to restore selection:', e);
        }
      });
    }
  };

  const handleFontSizeChange = (e) => {
    formatText("fontSize", e.target.value);
  };

  return (
    <div className="rich-text-editor">
      <div className="toolbar">
        <button onClick={() => formatText("bold")} title="Bold">
          <MdFormatBold size={20} />
        </button>
        <button onClick={() => formatText("italic")} title="Italic">
          <MdFormatItalic size={20} />
        </button>
        <button onClick={() => formatText("underline")} title="Underline">
          <MdFormatUnderlined size={20} />
        </button>
        <button onClick={() => formatText("justifyLeft")} title="Align Left">
          <MdFormatAlignLeft size={20} />
        </button>
        <button onClick={() => formatText("justifyCenter")} title="Center">
          <MdFormatAlignCenter size={20} />
        </button>
        <button onClick={() => formatText("justifyRight")} title="Align Right">
          <MdFormatAlignRight size={20} />
        </button>
        <select 
          onChange={handleFontSizeChange} 
          title="Font Size"
          defaultValue="3"
          className="font-size-select"
        >
          <option value="1">Small Text</option>
          <option value="3">Normal Text</option>
          <option value="5">Large Text</option>
          <option value="7">Huge Text</option>
        </select>
        <button 
          onClick={handleSpeechToText} 
          title={isListening ? "Stop Listening" : "Start Voice Input"}
          className={`mic-btn ${isListening ? 'listening' : ''}`}
        >
          {isListening ? <MdMicOff size={20} /> : <MdMic size={20} />}
        </button>
        <button 
          onClick={handleTextToSpeech} 
          title={isSpeaking ? "Stop Reading" : "Read Text Aloud"}
          className={`tts-btn ${isSpeaking ? 'speaking' : ''}`}
        >
          {isSpeaking ? <MdVolumeOff size={20} /> : <MdVolumeUp size={20} />}
        </button>
        <button 
          onClick={generateShareUrl} 
          title="Share Note"
          className="share-btn"
        >
          <MdShare size={20} />
        </button>
        <button 
          onClick={analyzeContent} 
          title="AI Analysis"
          className="analyze-btn"
          disabled={loading}
        >
          <span className="ai-text">AI</span>
          {loading && <span className="loading-spinner" />}
        </button>
        <div className="content-size-indicator">
          {contentSize.lines} lines • {contentSize.characters.toLocaleString()} chars
        </div>
      </div>

      {error && (
        <div className="analysis-error">
          {error}
          <button onClick={() => setError(null)} className="close-btn">
            <MdClose size={16} />
          </button>
        </div>
      )}

      {analysis && (
        <div className="analysis-results">
          <div className="analysis-header">
            <h3>AI Analysis</h3>
            <button onClick={() => setAnalysis(null)} className="close-btn">
              <MdClose size={16} />
            </button>
          </div>
          <div className="analysis-content">
            <div className="analysis-section">
              <h4>Summary</h4>
              <p>{analysis?.summary || "No summary available"}</p>
            </div>
            <div className="analysis-section">
              <h4>Suggested Tags</h4>
              <div className="tags-container">
                {analysis?.tags?.length > 0 
                  ? analysis.tags.map((tag, index) => (
                      <span key={index} className="tag">{tag}</span>
                    ))
                  : "No suggested tags"}
              </div>
            </div>
            <div className="analysis-section">
              <h4>Key Terms</h4>
              <div className="key-terms-container">
                {analysis?.keyTerms?.length > 0
                  ? analysis.keyTerms.map((term, index) => (
                      <span key={index} className="key-term">{term}</span>
                    ))
                  : "No key terms identified"}
              </div>
            </div>
            <div className="analysis-section">
              <h4>Grammar Check</h4>
              <p>{analysis?.grammarCheck || "No grammar issues found"}</p>
            </div>
          </div>
        </div>
      )}

      <div
        ref={editorRef}
        className="editor-content"
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            document.execCommand('insertLineBreak');
          }
        }}
        style={{
          whiteSpace: 'pre-wrap',
          wordWrap: 'break-word',
          fontFamily: 'inherit',
          minHeight: '200px',
          padding: '1rem'
        }}
      />

      {/* Share Modal */}
      {showShareModal && (
        <div className="share-modal-overlay">
          <div className="share-modal">
            <div className="share-modal-header">
              <h3>Share Your Note</h3>
              <button onClick={() => setShowShareModal(false)} className="close-btn">
                <MdClose size={20} />
              </button>
            </div>
            <div className="share-modal-content">
              <p>Copy this link to share your note with others:</p>
              <div className="share-url-container">
                <input 
                  type="text" 
                  value={shareUrl} 
                  readOnly 
                  className="share-url-input"
                />
                <button onClick={copyToClipboard} className="copy-btn">
                  <MdContentCopy size={16} />
                  Copy
                </button>
              </div>
              <div className="share-info">
                <p><strong>Note:</strong> This link will work for the current browser session only. The shared note will be automatically deleted when the browser is closed.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RichTextEditor;
