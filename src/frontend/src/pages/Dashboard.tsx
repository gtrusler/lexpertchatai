import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import { PlusIcon, ChevronLeftIcon, ChevronRightIcon, ArrowRightOnRectangleIcon, SpeakerWaveIcon } from '@heroicons/react/24/outline';
import Card from '../components/common/Card';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useTheme } from '../context/ThemeContext';

// Create a Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

interface Assistant {
  id: string;
  name: string;
  updated_at: string;
  status: string;
  template_id: string;
  docs_count: number;
  responses_count: number;
  token_usage?: number;
}

interface Template {
  id: string;
  name: string;
  description: string;
}

interface Conversation {
  id: string;
  bot_id: string;
  content: string;
  timestamp: string;
  is_user: boolean;
}

interface User {
  id: string;
  email: string;
  role: 'admin' | 'user';
}

// Update the type declarations at the top of the file
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

// Add this interface for SpeechRecognition events
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

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

const Dashboard: React.FC = () => {
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedAssistant, setSelectedAssistant] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const navigate = useNavigate();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const { isDarkMode, toggleDarkMode } = useTheme();

  // Memoized fetch function to improve performance
  const fetchData = useCallback(async () => {
    try {
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/login');
        return;
      }
      
      // Set user data
      setUser({
        id: user.id,
        email: user.email || 'Unknown',
        role: user.app_metadata?.role || 'user'
      });
      
      // In a real implementation, these would be actual Supabase queries with Redis caching
      // For now, we'll use mock data
      
      // Mock assistants data (renamed from bots)
      const mockAssistants: Assistant[] = [
        {
          id: '1',
          name: 'Weyl Assistant',
          updated_at: '2025-02-25T12:00:00Z',
          status: 'In Trial',
          template_id: '1',
          docs_count: 15,
          responses_count: 78,
          token_usage: 5000
        },
        {
          id: '2',
          name: 'Rachel Custody Case',
          updated_at: '2025-02-24T15:30:00Z',
          status: 'Drafting',
          template_id: '1',
          docs_count: 8,
          responses_count: 42,
          token_usage: 3200
        },
        {
          id: '3',
          name: 'Trademark Office Action',
          updated_at: '2025-02-23T09:15:00Z',
          status: 'Review',
          template_id: '2',
          docs_count: 5,
          responses_count: 23,
          token_usage: 1800
        }
      ];
      
      // Get user-created assistants from localStorage
      const userAssistants = JSON.parse(localStorage.getItem('userAssistants') || '[]');
      
      // Combine mock and user-created assistants
      const allAssistants = [...mockAssistants, ...userAssistants];
      
      // Mock templates data - removed "Bot" from names
      const mockTemplates: Template[] = [
        {
          id: '1',
          name: 'Texas Family Code',
          description: 'Specialized for family law cases in Texas'
        },
        {
          id: '2',
          name: 'Trademark',
          description: 'Handles trademark office actions and responses'
        }
      ];
      
      setAssistants(allAssistants);
      setTemplates(mockTemplates);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchData();
    
    // Add event listener for keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'b') {
        // Ctrl+B for assistants
        document.getElementById('assistants-heading')?.scrollIntoView({ behavior: 'smooth' });
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    // Check for voice command preference
    const voicePreference = localStorage.getItem('voiceEnabled') === 'true';
    setIsVoiceEnabled(voicePreference);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [fetchData]);

  // Fetch conversation history when an assistant is selected
  useEffect(() => {
    if (selectedAssistant) {
      // In a real implementation, this would be an actual Supabase query with Redis caching
      // For now, we'll use mock data
      
      const mockConversations: Conversation[] = [
        {
          id: '1',
          bot_id: selectedAssistant,
          content: 'Draft custody motion for Rachel, cite Texas §153.002.',
          timestamp: '2025-02-25T12:00:00Z',
          is_user: true
        },
        {
          id: '2',
          bot_id: selectedAssistant,
          content: 'I\'ve drafted a custody motion based on Texas Family Code §153.002, emphasizing the best interest of the child.',
          timestamp: '2025-02-25T12:00:05Z',
          is_user: false
        },
        {
          id: '3',
          bot_id: selectedAssistant,
          content: 'Add a section about Rachel\'s parenting history.',
          timestamp: '2025-02-25T12:05:00Z',
          is_user: true
        },
        {
          id: '4',
          bot_id: selectedAssistant,
          content: 'I\'ve added a section detailing Rachel\'s consistent involvement in the child\'s education and healthcare.',
          timestamp: '2025-02-25T12:05:10Z',
          is_user: false
        }
      ];
      
      setConversations(mockConversations);
      setSidebarOpen(true);
    }
  }, [selectedAssistant]);

  // Close sidebar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setSidebarOpen(false);
        setSelectedAssistant(null);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Voice command handling
  useEffect(() => {
    if (!isVoiceEnabled) return;
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('Speech recognition not supported in this browser');
      return;
    }
    
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase();
      
      // Handle voice commands
      if (transcript.includes('show weyl') || transcript.includes('open weyl')) {
        const weylAssistant = assistants.find(assistant => assistant.name.toLowerCase().includes('weyl'));
        if (weylAssistant) {
          handleAssistantClick(weylAssistant.id);
        }
      } else if (transcript.includes('new case')) {
        handleNewCase();
      } else if (transcript.includes('show history')) {
        // Show history of the first assistant if none is selected
        if (!selectedAssistant && assistants.length > 0) {
          setSelectedAssistant(assistants[0].id);
        }
      }
    };
    
    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error', event.error);
    };
    
    recognition.start();
    
    return () => {
      recognition.stop();
    };
  }, [isVoiceEnabled, assistants]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleNewCase = () => {
    navigate('/wizard');
  };

  const handleAssistantClick = (assistantId: string) => {
    navigate(`/chat/${assistantId}`);
  };

  const handleTemplateClick = (templateId: string) => {
    navigate(`/wizard/${templateId}`);
  };

  const handleViewHistory = (e: React.MouseEvent, assistantId: string) => {
    e.stopPropagation();
    setSelectedAssistant(assistantId);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const toggleVoiceCommands = () => {
    const newMode = !isVoiceEnabled;
    setIsVoiceEnabled(newMode);
    localStorage.setItem('voiceEnabled', newMode.toString());
  };

  const clearHistory = () => {
    if (selectedAssistant) {
      // In a real implementation, this would clear the history in Supabase
      setConversations([]);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" color="primary" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark' : ''}`}>
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-[#0078D4]">Lexpert Case AI</h1>
          
          <div className="flex items-center space-x-4">
            <span className="text-[#0078D4]">Welcome, {user?.email}</span>
            <button
              onClick={handleLogout}
              className="py-2 px-4 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'mr-80' : ''} bg-[#F5F6F7] dark:bg-gray-900 min-h-screen`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Assistants Header Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6 flex justify-between items-center">
            <h2 id="assistants-heading" className="text-xl font-semibold text-[#0078D4] dark:text-[#0078D4]">Assistants</h2>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-full text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                aria-label="Toggle dark mode"
              >
                {isDarkMode ? '🌙' : '☀️'}
              </button>
              
              <button
                onClick={toggleVoiceCommands}
                className="p-2 rounded-full text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                aria-label="Toggle voice commands"
              >
                <SpeakerWaveIcon className="h-5 w-5" />
              </button>
              
              <button
                onClick={handleNewCase}
                className="flex items-center py-2 px-4 bg-[#0078D4] text-white rounded-md hover:bg-[#0078D4]/90 transition-colors"
                aria-label="Create new assistant"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                New Assistant
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {assistants.map((assistant) => (
              <Card 
                key={assistant.id}
                title={assistant.name}
                accent={true}
                onClick={() => handleAssistantClick(assistant.id)}
                className="hover:shadow-md"
              >
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Updated {formatDate(assistant.updated_at)}
                  </span>
                  <span className="px-2 py-1 text-xs rounded-full bg-[#0078D4]/10 dark:bg-[#0078D4]/20 text-[#0078D4] dark:text-[#0078D4] font-medium">
                    {assistant.status}
                  </span>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    <span className="mr-3">Docs: {assistant.docs_count}</span>
                    <span className="mr-3">Responses: {assistant.responses_count}</span>
                    {assistant.token_usage && <span>Tokens: {assistant.token_usage.toLocaleString()}</span>}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewHistory(e, assistant.id);
                    }}
                    className="text-xs text-[#0078D4] dark:text-[#0078D4] hover:underline"
                    aria-label={`View ${assistant.name} conversation history`}
                  >
                    History
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Conversation History Sidebar */}
      {sidebarOpen && (
        <div 
          ref={sidebarRef}
          className="fixed right-0 top-0 h-full w-80 bg-gray-50 dark:bg-gray-800 shadow-lg z-10 overflow-y-auto transition-transform duration-300 transform"
          aria-label="Conversation history sidebar"
        >
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-[#0078D4] dark:text-[#0078D4]">Conversation History</h3>
            <button 
              onClick={() => {setSidebarOpen(false); setSelectedAssistant(null);}}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              aria-label="Close sidebar"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </div>
          
          <div className="p-4">
            {conversations.length > 0 ? (
              <>
                {conversations.map((conversation) => (
                  <div 
                    key={conversation.id} 
                    className={`mb-3 p-3 rounded-lg ${
                      conversation.is_user 
                        ? 'bg-[#0078D4]/10 dark:bg-[#0078D4]/20' 
                        : 'bg-white dark:bg-gray-700 shadow-sm'
                    }`}
                  >
                    <div className="text-sm font-medium mb-1">
                      {conversation.is_user ? 'You' : 'Lexpert'}
                    </div>
                    <div className="text-sm">
                      {conversation.content.length > 100 
                        ? `${conversation.content.substring(0, 100)}...` 
                        : conversation.content}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {formatTime(conversation.timestamp)}
                    </div>
                  </div>
                ))}
                
                <div className="flex space-x-2 mt-4">
                  <button 
                    onClick={() => handleAssistantClick(selectedAssistant || '')}
                    className="flex-1 py-2 px-4 bg-[#0078D4] text-white rounded-md hover:bg-[#0078D4]/90 transition-colors"
                    aria-label="Continue conversation"
                  >
                    Continue Conversation
                  </button>
                  <button 
                    onClick={clearHistory}
                    className="py-2 px-4 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    aria-label="Clear history"
                  >
                    Clear
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <p>No conversation history available.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard; 