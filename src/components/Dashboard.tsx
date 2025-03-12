import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

// Mock data for case bots
const caseBots = [
  { id: '1', name: 'Weyl Bot', description: 'Family law case for Weyl', lastActive: '2 hours ago' },
  { id: '2', name: 'Trademark Bot', description: 'Trademark office action', lastActive: '1 day ago' },
  { id: '3', name: 'Holly vs. Waytt', description: 'CPS reports case', lastActive: '3 days ago' },
];

const Dashboard: React.FC = () => {
  const { isDarkMode } = useTheme();

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-800'}`}>
      <header className={`p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-md`}>
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold text-[#0078D4]">Lexpert Case AI</h1>
          <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Your AI-powered legal assistant</p>
        </div>
      </header>

      <main className="container mx-auto p-4 max-w-6xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Your Case Bots</h2>
          <button className="bg-[#0078D4] text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
            + New Case Bot
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {caseBots.map((bot) => (
            <Link 
              key={bot.id} 
              to={`/chat/${bot.id}`} 
              className={`block rounded-lg shadow-md ${isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'} transition-colors`}
            >
              <div className="p-4">
                <h3 className="font-semibold text-lg">{bot.name}</h3>
                <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} text-sm mb-2`}>{bot.description}</p>
                <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Last active: {bot.lastActive}
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Recent Templates</h2>
          <div className={`rounded-lg shadow-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-4`}>
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              <li className="py-3">
                <a href="#" className={`block hover:${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                  Custody Motion Template
                </a>
              </li>
              <li className="py-3">
                <a href="#" className={`block hover:${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                  Temporary Orders Template
                </a>
              </li>
              <li className="py-3">
                <a href="#" className={`block hover:${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                  Trademark Response Template
                </a>
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard; 