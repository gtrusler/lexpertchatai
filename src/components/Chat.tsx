import React, { useState, FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

interface ChatProps {
  botName?: string;
}

const Chat: FC<ChatProps> = ({ botName = 'Lexpert Bot' }) => {
  const navigate = useNavigate();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Array<{ text: string; isUser: boolean }>>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    // Add user message to chat
    const newMessages = [...messages, { text: message, isUser: true }];
    setMessages(newMessages);
    setMessage('');
    setIsLoading(true);

    try {
      // Simulate API call with 3-5s response time
      setTimeout(() => {
        setMessages([
          ...newMessages,
          { 
            text: `Response to: "${message}"`, 
            isUser: false 
          }
        ]);
        setIsLoading(false);
      }, 3000);
    } catch (error) {
      console.error('Error sending message:', error);
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-800'}`}>
      {/* Navigation Header */}
      <nav className={`p-4 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-blue-600'} border-b flex justify-between items-center`}>
        <div className="flex items-center">
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-[#0078D4] text-white rounded-md p-2 hover:bg-blue-700 transition-colors"
            aria-label="Return to dashboard"
            accessKey="b"
          >
            ← Back to Dashboard
          </button>
          
          {/* Breadcrumb */}
          <div className="ml-4 text-sm hidden md:block">
            <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              <a href="/dashboard" className="hover:underline">Lexpert Case AI</a> &gt; 
              <span className="mx-1">{botName}</span> &gt; <span>Chat</span>
            </span>
          </div>
        </div>
        
        {/* Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsVoiceActive(prev => !prev)}
            className={`p-2 rounded-full ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'}`}
            aria-label="Toggle voice input"
            accessKey="v"
          >
            {isVoiceActive ? '🎙️' : '🔇'}
          </button>
          <button
            onClick={toggleDarkMode}
            className={`p-2 rounded-full ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'}`}
            aria-label="Toggle dark mode"
            accessKey="m"
          >
            {isDarkMode ? '🌙' : '☀️'}
          </button>
        </div>
      </nav>

      {/* Chat Messages */}
      <div className="container mx-auto p-4 max-w-4xl">
        <div className={`rounded-lg p-4 mb-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-md`}>
          <div className="space-y-4 mb-4 max-h-[60vh] overflow-y-auto">
            {messages.length === 0 ? (
              <div className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Start a conversation with {botName}
              </div>
            ) : (
              messages.map((msg, index) => (
                <div 
                  key={index} 
                  className={`p-3 rounded-lg ${
                    msg.isUser 
                      ? isDarkMode ? 'bg-blue-900 text-white ml-auto' : 'bg-blue-100 text-gray-800 ml-auto' 
                      : isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-800'
                  } max-w-[80%] ${msg.isUser ? 'ml-auto' : 'mr-auto'}`}
                >
                  {msg.text}
                  {!msg.isUser && (
                    <div className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Based on: Texas §153.002, p. 2
                    </div>
                  )}
                </div>
              ))
            )}
            {isLoading && (
              <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} max-w-[80%]`}>
                <div className="flex space-x-2">
                  <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce"></div>
                  <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce delay-100"></div>
                  <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce delay-200"></div>
                </div>
              </div>
            )}
          </div>

          {/* Message Input */}
          <form onSubmit={handleSendMessage} className="flex items-center">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="How can Lexpert help today?"
              className={`w-full p-3 rounded-l-md border ${
                isDarkMode 
                  ? 'bg-gray-700 text-white border-gray-600 focus:border-blue-500' 
                  : 'bg-white text-gray-800 border-gray-300 focus:border-blue-600'
              } focus:outline-none focus:ring-2 focus:ring-blue-600`}
              aria-label="Chat input"
            />
            <button
              type="submit"
              className="bg-[#0078D4] text-white p-3 rounded-r-md hover:bg-blue-700 transition-colors"
              disabled={isLoading}
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Chat; 