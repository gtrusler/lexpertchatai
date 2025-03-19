import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PaperClipIcon, ArrowUpIcon, SpeakerWaveIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Message from '../components/chat/Message';
import Tooltip from '../components/common/Tooltip';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useTheme } from '../context/ThemeContext';
import { storage } from '../services/supabase';

// Add these type declarations for speech recognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface SpeechRecognitionEvent extends Event {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
    length: number;
  };
}

// Removed unused interface

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  sources?: string[];
}

interface Bot {
  id: string;
  name: string;
  characters?: {
    name: string;
    role: string;
  }[];
  jurisdiction?: string;
}

interface AutoTagResult {
  tag: string;
  confidence: number;
}

const Chat: React.FC = () => {
  const { botId } = useParams<{ botId: string }>();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [bot, setBot] = useState<Bot | null>(null);
  const [tooltip, setTooltip] = useState<string | null>(null);
  const [ghostMode, setGhostMode] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isVoiceInput, setIsVoiceInput] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [showMemory, setShowMemory] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognition = useRef<any>(null);
  const { isDarkMode, toggleDarkMode } = useTheme();

  // Fetch bot data and chat history
  useEffect(() => {
    const fetchBotData = async () => {
      try {
        // Check for voice command preference
        const voicePreference = localStorage.getItem('voiceEnabled') === 'true';
        setIsVoiceEnabled(voicePreference);
        
        // Check if this is a user-created assistant from localStorage
        const userAssistants = JSON.parse(localStorage.getItem('userAssistants') || '[]');
        const userAssistant = userAssistants.find((a: any) => a.id === botId);
        
        if (userAssistant) {
          // Use the user-created assistant data
          setBot({
            id: userAssistant.id,
            name: userAssistant.name,
            characters: [], // These would be populated from the wizard data in a real implementation
            jurisdiction: ''
          });
          
          // For new assistants, start with an empty chat
          setMessages([]);
          return;
        }
        
        // If not a user-created assistant, use mock data
        // Mock bot data
        const mockBot: Bot = {
          id: botId || '1',
          name: botId === '1' ? 'Weyl Bot' : 
                 botId === '2' ? 'Rachel Custody Case' : 
                 botId === '3' ? 'Trademark Office Action' : 'Unknown Bot',
          characters: [
            { name: 'Rachel Weyl', role: 'Client' },
            { name: 'John Weyl', role: 'Opposing Party' }
          ],
          jurisdiction: 'Travis County, Texas'
        };
        
        setBot(mockBot);
        
        // Mock chat history - in a real implementation, this would be fetched from Supabase
        // with Redis caching, limited to last 10 messages or 10,000 tokens
        const mockMessages: Message[] = [
          {
            id: '1',
            role: 'user',
            content: 'Draft custody motion for Rachel, cite Texas §153.002.',
            timestamp: '2025-02-25T12:00:00Z'
          },
          {
            id: '2',
            role: 'assistant',
            content: 'I\'ve drafted a custody motion for Rachel based on Texas Family Code §153.002. The motion emphasizes the best interest of the child as the primary consideration in determining conservatorship and possession.\n\nThe draft includes relevant case law supporting the argument that stability and continuity in the child\'s current environment would serve their best interest.',
            timestamp: '2025-02-25T12:00:05Z',
            sources: ['Texas Family Code §153.002', 'Rachel\'s Affidavit, p. 3']
          }
        ];
        
        if (!ghostMode) {
          setMessages(mockMessages);
        }
      } catch (error) {
        console.error('Error fetching bot data:', error);
      }
    };

    fetchBotData();
    
    return () => {
      // Clean up speech recognition if active
      if (recognition.current) {
        recognition.current.stop();
      }
    };
  }, [botId, ghostMode]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Enhanced prompt coaching with NLP-like suggestions
  useEffect(() => {
    if (input.length > 0) {
      // More sophisticated prompt coaching logic based on bot context
      if (bot?.characters && input.includes('draft') && !input.includes('cite')) {
        setTooltip(`Try adding a citation, e.g., "cite Texas §153.002" and mentioning ${bot.characters[0].name}`);
      } else if (input.includes('summarize') && !input.includes('use') && uploadedFiles.length > 0) {
        setTooltip(`Try specifying which document to use, e.g., "use ${uploadedFiles[0].name}"`);
      } else if (input.length > 50 && !input.includes('draft') && !input.includes('summarize') && !input.includes('analyze')) {
        setTooltip('Try structuring your prompt with an action verb like "draft," "summarize," or "analyze"');
      } else {
        setTooltip(null);
      }
    } else {
      setTooltip(null);
    }
  }, [input, bot, uploadedFiles]);

  const handleSendMessage = async () => {
    if (input.trim() === '') return;
    
    const newUserMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date().toISOString()
    };
    
    setMessages((prev) => [...prev, newUserMessage]);
    setInput('');
    setLoading(true);
    
    try {
      // In a real implementation, this would be an API call to the backend
      // with Redis caching for faster responses
      
      // Simulate API call delay (3-5 seconds)
      const responseTime = Math.floor(Math.random() * 2000) + 3000; // 3-5 seconds
      
      setTimeout(() => {
        const newAssistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Based on your request, I\'ve analyzed the relevant legal documents and prepared a response. The Texas Family Code §153.002 states that "the best interest of the child shall be the primary consideration of the court in determining the issues of conservatorship and possession of and access to the child."\n\nI recommend structuring your argument around this principle, emphasizing how your proposed arrangement serves the child\'s best interests with respect to stability, emotional development, and educational needs.',
          timestamp: new Date().toISOString(),
          sources: ['Texas Family Code §153.002', 'Case History, p. 7']
        };
        
        setMessages((prev) => [...prev, newAssistantMessage]);
        setLoading(false);
      }, responseTime);
      
      // Clear uploaded files after sending
      setUploadedFiles([]);
      
    } catch (error) {
      console.error('Error sending message:', error);
      setLoading(false);
    }
  };

  const handleFileUpload = (files: FileList) => {
    if (files && files.length > 0) {
      const fileArray = Array.from(files);
      setUploadedFiles((prev) => [...prev, ...fileArray]);
      
      // Process each file and upload directly to Supabase
      fileArray.forEach(async (file) => {
        try {
          console.log(`[Chat] Uploading file: ${file.name}`);
          setLoading(true); // Use existing loading state
          setError(null); // Clear any previous errors
          
          // Create a unique file path for the upload
          const timestamp = new Date().getTime();
          const filePath = `${botId || 'general'}/${timestamp}_${file.name}`;
          
          console.log(`[Chat] Uploading to path: ${filePath}`);
          
          // Upload the file directly to Supabase storage using the enhanced storage service
          // The storage service now handles bucket creation and validation
          const { data, error } = await storage.uploadFile('documents', filePath, file);
          
          if (error) {
            console.error('[Chat] Upload error:', error);
            throw new Error(`File upload failed: ${error.message}`);
          }
          
          console.log('[Chat] Upload successful:', data);
          
          // Get the public URL of the uploaded file
          const { data: urlData } = storage.getFileUrl('documents', filePath);
          console.log('[Chat] File URL:', urlData?.publicUrl);
          
          // Show success message
          const successMessage = `File ${file.name} uploaded successfully`;
          setSuccess(successMessage);
          setTimeout(() => setSuccess(null), 3000);
          
          // Simulate auto-tagging with confidence
          setTimeout(() => {
            // Simulate NLP-based auto-tagging
            const autoTags: AutoTagResult[] = [];
            
            if (file.name.toLowerCase().includes('affidavit')) {
              autoTags.push({ tag: 'affidavit', confidence: 0.95 });
            } else if (file.name.toLowerCase().includes('petition')) {
              autoTags.push({ tag: 'petition', confidence: 0.92 });
            } else if (file.name.toLowerCase().includes('report')) {
              autoTags.push({ tag: 'report', confidence: 0.88 });
            } else {
              autoTags.push({ tag: 'document', confidence: 0.75 });
            }
            
            // Add character names as tags if they appear in the filename
            if (bot?.characters) {
              bot.characters.forEach(char => {
                if (file.name.toLowerCase().includes(char.name.toLowerCase())) {
                  autoTags.push({ 
                    tag: char.name.toLowerCase().replace(/\s+/g, '_'), 
                    confidence: 0.90 
                  });
                }
              });
            }
            
            // Show confirmation for low confidence tags
            const lowConfidenceTags = autoTags.filter(tag => tag.confidence < 0.9);
            if (lowConfidenceTags.length > 0) {
              const tagNames = lowConfidenceTags.map(t => t.tag).join(', ');
              const avgConfidence = Math.round(
                lowConfidenceTags.reduce((sum, tag) => sum + tag.confidence, 0) / lowConfidenceTags.length * 100
              );
              
              setTooltip(`File tagged as [${tagNames}] with ${avgConfidence}% confidence. Click to confirm or edit.`);
            }
          }, 1000);
          
        } catch (err) {
          console.error('[Chat] Error handling file upload:', err);
          setError(`Upload failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
          setTimeout(() => setError(null), 5000);
        } finally {
          setLoading(false);
        }
      });
    }
  };

  const removeFile = (fileName: string) => {
    setUploadedFiles(prev => prev.filter(file => file.name !== fileName));
  };

  const toggleVoiceInput = () => {
    if (isVoiceInput) {
      // Stop listening
      if (recognition.current) {
        recognition.current.stop();
        recognition.current = null;
      }
      setIsVoiceInput(false);
    } else {
      // Start listening
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        alert('Speech recognition is not supported in your browser.');
        return;
      }
      
      recognition.current = new SpeechRecognition();
      recognition.current.continuous = false;
      recognition.current.interimResults = true;
      
      recognition.current.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
      };
      
      recognition.current.onend = () => {
        setIsVoiceInput(false);
      };
      
      recognition.current.start();
      setIsVoiceInput(true);
    }
  };

  const toggleVoiceCommands = () => {
    const newMode = !isVoiceEnabled;
    setIsVoiceEnabled(newMode);
    localStorage.setItem('voiceEnabled', newMode.toString());
  };

  // Removed unused formatTimestamp function as it's already implemented in the Message component

  const handleKeyboardShortcuts = (e: React.KeyboardEvent) => {
    // Ctrl+U for upload
    if (e.ctrlKey && e.key === 'u') {
      e.preventDefault();
      fileInputRef.current?.click();
    }
    
    // Ctrl+V for voice input
    if (e.ctrlKey && e.key === 'v') {
      e.preventDefault();
      toggleVoiceInput();
    }
  };

  // Add keyboard shortcut handler
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Alt + B for back to dashboard
      if (e.altKey && e.key === 'b') {
        e.preventDefault();
        navigate('/');
      }
      // Alt + M for toggle dark mode
      if (e.altKey && e.key === 'm') {
        e.preventDefault();
        toggleDarkMode();
      }
      // Alt + V for toggle voice input
      if (e.altKey && e.key === 'v') {
        e.preventDefault();
        toggleVoiceInput();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [navigate, toggleDarkMode, toggleVoiceInput]);

  return (
    <div 
      className={`flex flex-col h-[calc(100vh-10rem)] ${isDarkMode ? 'dark' : ''}`}
      onKeyDown={handleKeyboardShortcuts}
    >
      {/* Navigation Header */}
      <div className="flex justify-between items-center mb-6 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/')}
            className="bg-[#0078D4] text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center group"
            aria-label="Return to dashboard (Alt+B)"
            accessKey="b"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5 mr-2 transform group-hover:-translate-x-1 transition-transform" 
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              <path 
                fillRule="evenodd" 
                d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" 
                clipRule="evenodd" 
              />
            </svg>
            Return to Dashboard
          </button>
          
          {/* Breadcrumb */}
          <div className="ml-4 text-sm hidden md:block">
            <nav aria-label="Breadcrumb">
              <ol className="flex items-center space-x-2">
                <li>
                  <a 
                    href="/" 
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                    onClick={(e) => {
                      e.preventDefault();
                      navigate('/');
                    }}
                  >
                    Lexpert Case AI
                  </a>
                </li>
                <li className="flex items-center">
                  <svg className="h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="ml-2 text-gray-500 dark:text-gray-400">{bot?.name}</span>
                </li>
              </ol>
            </nav>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            aria-label={isDarkMode ? "Switch to light mode (Alt+M)" : "Switch to dark mode (Alt+M)"}
            accessKey="m"
          >
            {isDarkMode ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
          
          <button
            onClick={toggleVoiceCommands}
            className={`p-2 rounded-full transition-colors ${
              isVoiceEnabled 
                ? 'bg-[#0078D4] text-white hover:bg-[#0078D4]/90' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
            aria-label={isVoiceEnabled ? "Disable voice commands (Alt+V)" : "Enable voice commands (Alt+V)"}
            accessKey="v"
          >
            <SpeakerWaveIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {bot && (
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{bot.name}</h1>
            {bot.jurisdiction && (
              <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                {bot.jurisdiction}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowMemory(!showMemory)}
              className={`p-2 rounded-full ${showMemory ? 'bg-[#0078D4] text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
              aria-label={showMemory ? "Hide memory" : "Show memory"}
              title="Toggle memory"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </button>
            
            <label className="flex items-center cursor-pointer">
              <span className="mr-2 text-sm text-gray-600 dark:text-gray-400">Ghost Mode</span>
              <div className="relative">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={ghostMode}
                  onChange={() => setGhostMode(!ghostMode)}
                />
                <div className={`block w-10 h-6 rounded-full transition-colors ${ghostMode ? 'bg-[#0078D4]' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${ghostMode ? 'transform translate-x-4' : ''}`}></div>
              </div>
            </label>
          </div>
        </div>
      )}
      
      <div className="flex flex-1 gap-4">
        {/* Memory sidebar */}
        {showMemory && (
          <div className="w-64 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 overflow-y-auto">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-semibold text-[#0078D4] dark:text-[#0078D4]">Memory</h3>
              <button 
                onClick={() => setShowMemory(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                aria-label="Close memory sidebar"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
            
            {bot?.characters && bot.characters.length > 0 && (
              <div className="mb-4">
                <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Cast of Characters</h4>
                <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                  {bot.characters.map((char, index) => (
                    <li key={index} className="flex justify-between">
                      <span>{char.name}</span>
                      <span className="text-gray-500 dark:text-gray-500">{char.role}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {bot?.jurisdiction && (
              <div className="mb-4">
                <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Jurisdiction</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400">{bot.jurisdiction}</p>
              </div>
            )}
            
            <div>
              <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Recent Documents</h4>
              <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                <li className="truncate">Rachel's Affidavit.pdf</li>
                <li className="truncate">Custody Petition.docx</li>
                <li className="truncate">Texas Family Code.pdf</li>
              </ul>
            </div>
          </div>
        )}
        
        {/* Main chat area */}
        <div className={`flex-1 flex flex-col ${showMemory ? 'w-[calc(100%-16rem)]' : 'w-full'}`}>
          <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-4 p-4">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                <p>No messages yet. Start a conversation!</p>
              </div>
            ) : (
              messages.map((message) => (
                <Message
                  key={message.id}
                  content={message.content}
                  role={message.role}
                  timestamp={message.timestamp}
                  sources={message.sources}
                  isTemporary={ghostMode}
                  tabIndex={0}
                />
              ))
            )}
            {loading && (
              <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
                <LoadingSpinner 
                  size="sm" 
                  color="primary" 
                  isLoading={loading} 
                  ariaLabel="Lexpert is generating a response" 
                />
                <span className="text-sm">Lexpert is thinking...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          {tooltip && (
            <Tooltip 
              content={tooltip} 
              position="top" 
              dismissible 
              onDismiss={() => setTooltip(null)}
              type="prompt-coach"
              targetRef={inputRef}
              show={!!tooltip}
            />
          )}
          
          {success && (
            <div className="text-sm text-green-600 dark:text-green-400 mb-2">{success}</div>
          )}
          {error && (
            <div className="text-sm text-red-600 dark:text-red-400 mb-2">{error}</div>
          )}
          
          <div className="flex items-center space-x-2">
            {uploadedFiles.length > 0 && (
              <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-md p-2 mb-2">
                <div className="flex justify-between items-center mb-1">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Uploaded files:</p>
                  <button
                    onClick={() => setUploadedFiles([])}
                    className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    Clear all
                  </button>
                </div>
                <ul className="text-xs text-gray-600 dark:text-gray-400">
                  {uploadedFiles.map((file, index) => (
                    <li key={index} className="flex justify-between items-center">
                      <span className="truncate">{file.name}</span>
                      <button
                        onClick={() => removeFile(file.name)}
                        className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 ml-2"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
              title="Upload file (Ctrl+U)"
              aria-label="Upload file"
            >
              <PaperClipIcon className="h-5 w-5" />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
              className="hidden"
              multiple
              accept=".pdf,.doc,.docx,.txt"
            />
            
            <button
              onClick={toggleVoiceInput}
              className={`p-2 rounded-full ${isVoiceInput ? 'bg-[#0078D4] text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400'}`}
              title="Voice input (Ctrl+V)"
              aria-label={isVoiceInput ? "Stop voice input" : "Start voice input"}
            >
              <SpeakerWaveIcon className="h-5 w-5" />
            </button>
            
            <input
              type="text"
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder={isVoiceInput ? "Listening..." : "How can Lexpert help today?"}
              className="flex-1 py-2 px-4 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0078D4] focus:border-transparent text-gray-900 dark:text-gray-100"
              disabled={loading || isVoiceInput}
              aria-label="Message input"
            />
            
            <button
              onClick={handleSendMessage}
              disabled={loading || input.trim() === ''}
              className={`p-2 rounded-full ${
                loading || input.trim() === ''
                  ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
                  : 'bg-[#0078D4] text-white hover:bg-[#0078D4]/90'
              }`}
              aria-label="Send message"
            >
              <ArrowUpIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat; 