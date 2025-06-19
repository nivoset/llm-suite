'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { loadJiraDocuments } from '~/llm/jira';
import { JiraCard } from './JiraCard';
import { ChatMessage, ChatPanel } from './ChatPanel';
import { useJiraAnalysis } from '~/hooks/useJiraAnalysis';
import { useQueryParameter } from '~/hooks/useQueryParameter';
import type { JiraDocument } from '~/types/jira';

interface JiraDetailViewProps {
  issueKey: string;
}

export function JiraDetailView({ issueKey }: JiraDetailViewProps) {
  const [activeTab, setActiveTab] = useQueryParameter('tab', 'chat');
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const { data: jiraCards, isLoading, refetch: refetchCard } = useQuery({
    queryKey: ['jira-cards', 'SCRUM'],
    queryFn: async () => {
      const docs = await loadJiraDocuments({ 
        projectKey: 'SCRUM',
      });
      return docs;
    },
  });

  const jiraCard = jiraCards?.find(doc => doc.metadata.key === issueKey);

  const { data: analysis, isLoading: isAnalysisLoading, refetch: refetchAnalysis } = useJiraAnalysis(jiraCard);

  const handleRefresh = async () => {
    await refetchCard();
    if (activeTab === 'analysis') {
      await refetchAnalysis();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[100dvh] dark:bg-gray-900">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 dark:border-gray-100"></div>
      </div>
    );
  }

  if (!jiraCard) {
    return (
      <div className="flex items-center justify-center h-[100dvh] dark:bg-gray-900">
        <div className="bg-red-50 dark:bg-red-900 text-red-800 dark:text-red-200 p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Card Not Found</h3>
          <p>Could not find card with key: {issueKey}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 container bg-white dark:bg-gray-900">
      <div className="grid lg:grid-cols-2 grid-cols-1 h-[100dvh]">
        {/* Left panel - Jira details */}
        <div className="p-6 lg:border-r border-b lg:border-b-0 border-gray-200 dark:border-gray-700 overflow-y-auto">
          <JiraCard 
            doc={jiraCard} 
            isDetailView 
            onRefresh={handleRefresh}
            isRefreshing={isLoading || (activeTab === 'analysis' && isAnalysisLoading)}
          />
        </div>

        {/* Right panel - Chat interface */}
        <div className="flex flex-col h-[100dvh]">
          {/* Tabs */}
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button
              role="tab"
              aria-selected={activeTab === 'chat'}
              aria-controls="chat-panel"
              className={`flex-1 py-4 px-6 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                activeTab === 'chat'
                  ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
              onClick={() => setActiveTab('chat')}
            >
              Chat
            </button>
            <button
              role="tab"
              aria-selected={activeTab === 'analysis'}
              aria-controls="analysis-panel"
              className={`flex-1 py-4 px-6 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                activeTab === 'analysis'
                  ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
              onClick={() => setActiveTab('analysis')}
            >
              Analysis
            </button>
          </div>

          {/* Tab panels */}
          <div className="flex-1 overflow-hidden">
            {activeTab === 'chat' ? (
              <div id="chat-panel" role="tabpanel" aria-labelledby="chat-tab" className="h-full">
                <ChatPanel
                  messages={messages}
                  onSendMessage={async (message) => {
                    setMessages(prev => [...prev, { 
                      role: 'user', 
                      content: message, 
                      timestamp: new Date().toISOString() 
                    }]);
                    // Add AI response simulation
                    setTimeout(() => {
                      setMessages(prev => [...prev, {
                        role: 'assistant',
                        content: 'This is a simulated response. The AI integration is coming soon!',
                        timestamp: new Date().toISOString()
                      }]);
                    }, 1000);
                  }}
                  context={jiraCard}
                />
              </div>
            ) : (
              <div id="analysis-panel" role="tabpanel" aria-labelledby="analysis-tab" className="p-6 overflow-y-auto h-full">
                {isAnalysisLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  </div>
                ) : analysis ? (
                  <div className="space-y-8">
                    {/* Overview section combining key insights */}
                    <section>
                      <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Overview</h2>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
                          <h3 className="text-lg font-medium mb-2 text-blue-700 dark:text-blue-300">Business Impact</h3>
                          <p className="text-gray-700 dark:text-gray-300">{analysis.businessAnalysis}</p>
                        </div>
                        <div className="bg-purple-50 dark:bg-purple-900/30 p-4 rounded-lg">
                          <h3 className="text-lg font-medium mb-2 text-purple-700 dark:text-purple-300">Architecture</h3>
                          <p className="text-gray-700 dark:text-gray-300">{analysis.architecturalAnalysis}</p>
                        </div>
                        <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg">
                          <h3 className="text-lg font-medium mb-2 text-green-700 dark:text-green-300">Implementation</h3>
                          <p className="text-gray-700 dark:text-gray-300">{analysis.developmentAnalysis}</p>
                        </div>
                      </div>
                    </section>

                    {/* Key Questions section */}
                    <section>
                      <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Key Questions</h2>
                      <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
                        <ul className="space-y-3">
                          {analysis.questions.map((q, i) => {
                            const [category] = q.match(/\[(.*?)\]/) || ['[Other]'];
                            const question = q.replace(/\[(.*?)\]\s*/, '');
                            return (
                              <li key={i} className="flex items-start gap-3">
                                <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                                  category.includes('Business') ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' :
                                  category.includes('Technical') ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300' :
                                  category.includes('Implementation') ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' :
                                  'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                }`}>
                                  {category.replace(/[\[\]]/g, '')}
                                </span>
                                <span className="text-gray-700 dark:text-gray-300">{question}</span>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    </section>

                    {/* Recommendations section */}
                    <section>
                      <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Recommendations</h2>
                      <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
                        <ul className="space-y-3">
                          {analysis.recommendations.map((r, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-green-600 dark:text-green-400">•</span>
                              <span className="text-gray-700 dark:text-gray-300">{r}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </section>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 