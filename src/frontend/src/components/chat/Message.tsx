import React from 'react';

interface MessageProps {
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
  sources?: string[];
  isTemporary?: boolean;
  tabIndex?: number;
}

const Message: React.FC<MessageProps> = ({ 
  content, 
  role, 
  timestamp, 
  sources, 
  isTemporary = false,
  tabIndex = 0
}) => {
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div 
      className={`mb-4 ${role === 'user' ? 'ml-auto max-w-3xl' : 'mr-auto max-w-3xl'}`}
      aria-label={`Message from ${role === 'user' ? 'you' : 'Lexpert'} at ${formatTimestamp(timestamp)}`}
      tabIndex={tabIndex}
    >
      <div
        className={`rounded-lg p-3 ${
          role === 'user'
            ? 'bg-primary text-white border-primary'
            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-600'
        } ${isTemporary ? 'opacity-70' : 'opacity-100'} border shadow-sm`}
      >
        <div className="whitespace-pre-wrap">{content}</div>
        {sources && sources.length > 0 && (
          <div className="mt-2 pt-2 text-xs border-t border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400">
            <div className="font-medium">Sources:</div>
            <ul className="list-disc list-inside">
              {sources.map((source, index) => (
                <li key={index}>{source}</li>
              ))}
            </ul>
          </div>
        )}
        {isTemporary && (
          <div className="mt-2 text-xs italic text-gray-500 dark:text-gray-400">
            Temporary - not saved
          </div>
        )}
      </div>
      <div
        className={`text-xs mt-1 ${
          role === 'user' ? 'text-right' : 'text-left'
        } text-gray-500 dark:text-gray-400`}
      >
        {formatTimestamp(timestamp)}
      </div>
    </div>
  );
};

export default Message; 