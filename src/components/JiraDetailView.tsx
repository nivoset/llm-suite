'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { loadJiraDocuments } from '~/llm/jira';
import { JiraCard } from './JiraCard';
import { ChatMessage, ChatPanel } from './ChatPanel';

interface JiraDetailViewProps {
  issueKey: string;
}

export function JiraDetailView({ issueKey }: JiraDetailViewProps) {
  const [activeTab, setActiveTab] = useState('chat');
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const { data: jiraCards, isLoading, error } = useQuery({
    queryKey: ['jira-cards', 'SCRUM'],
    queryFn: async () => {
      const docs = await loadJiraDocuments({ 
        projectKey: 'SCRUM',
      });
      return docs;
    },
    select: (data) => data.filter(doc => doc.metadata.key === issueKey)
  });

  const jiraCard = jiraCards?.[0];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 dark:border-gray-100"></div>
      </div>
    );
  }

  if (error || !jiraCard) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-50 dark:bg-red-900 text-red-800 dark:text-red-200 p-4 rounded-lg shadow max-w-lg">
          <h3 className="text-lg font-semibold mb-2">Error Loading Jira Card</h3>
          <p>{error?.message || 'Card not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white dark:bg-gray-900">
      {/* Left panel - Jira details */}
      <div className="w-1/2 p-6 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
        <JiraCard doc={jiraCard} isDetailView />
      </div>

      {/* Right panel - Chat interface */}
      <div className="w-1/2 flex flex-col">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex">
            <button
              className={`px-4 py-2 font-medium ${
                activeTab === 'chat'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('chat')}
            >
              Chat
            </button>
            <button
              className={`px-4 py-2 font-medium ${
                activeTab === 'analysis'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('analysis')}
            >
              Analysis
            </button>
            <button
              className={`px-4 py-2 font-medium ${
                activeTab === 'tasks'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('tasks')}
            >
              Tasks
            </button>
          </nav>
        </div>

        <div className="flex-1 p-6">
          {activeTab === 'chat' && (
            <ChatPanel
              messages={messages}
              onSendMessage={async (message) => {
                const newMessage: ChatMessage = {
                  role: 'user',
                  content: message,
                  timestamp: new Date().toISOString(),
                };
                setMessages((prev) => [...prev, newMessage]);
                // TODO: Implement AI response
              }}
              context={jiraCard}
            />
          )}
          {activeTab === 'analysis' && (
            <div className="text-gray-600 dark:text-gray-300">
              <h3 className="text-lg font-medium mb-4">Analysis</h3>
              <p>Coming soon: AI-powered analysis of the Jira issue.</p>
            </div>
          )}
          {activeTab === 'tasks' && (
            <div className="text-gray-600 dark:text-gray-300">
              <h3 className="text-lg font-medium mb-4">Tasks</h3>
              <p>Coming soon: AI-generated task breakdown and suggestions.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 