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

  const { data: jiraCards, isLoading, error, refetch: refetchCard } = useQuery({
    queryKey: ['jira-cards', 'SCRUM'],
    queryFn: async () => {
      const docs = await loadJiraDocuments({ 
        projectKey: 'SCRUM',
        searchQuery: `key = ${issueKey}`,
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

  if (!jiraCard) {
    return <div>Loading...</div>;
  }

  return (
    <div className="@container min-h-screen bg-white dark:bg-gray-900">
      <div className="grid @[1000px]:grid-cols-2 grid-cols-1 h-full">
        {/* Left panel - Jira details */}
        <div className="p-6 @[1000px]:border-r border-b @[1000px]:border-b-0 border-gray-200 dark:border-gray-700">
          <JiraCard 
            doc={jiraCard} 
            isDetailView 
            onRefresh={handleRefresh}
            isRefreshing={isLoading || (activeTab === 'analysis' && isAnalysisLoading)}
          />
        </div>

        {/* Right panel - Chat interface */}
        <div className="flex flex-col">
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

          {/* Tab content */}
          <div className="flex-1 overflow-auto">
            {activeTab === 'chat' ? (
              <div id="chat-panel" role="tabpanel" aria-labelledby="chat-tab" className="h-full">
                <ChatPanel 
                  messages={messages} 
                  onSendMessage={async (msg: string) => {
                    setMessages([...messages, { role: 'user', content: msg, timestamp: new Date().toISOString() }]);
                  }}
                  context={jiraCard}
                />
              </div>
            ) : (
              <div id="analysis-panel" role="tabpanel" aria-labelledby="analysis-tab" className="p-6">
                {isAnalysisLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  </div>
                ) : analysis ? (
                  <div className="space-y-6">
                    <section>
                      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Business Analysis</h2>
                      <p className="text-gray-700 dark:text-gray-300">{analysis.businessAnalysis}</p>
                    </section>
                    <section>
                      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Architectural Analysis</h2>
                      <p className="text-gray-700 dark:text-gray-300">{analysis.architecturalAnalysis}</p>
                    </section>
                    <section>
                      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Development Analysis</h2>
                      <p className="text-gray-700 dark:text-gray-300">{analysis.developmentAnalysis}</p>
                    </section>
                    <section>
                      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Key Questions</h2>
                      <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                        {analysis.questions.map((q, i) => (
                          <li key={i}>{q}</li>
                        ))}
                      </ul>
                    </section>
                    <section>
                      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Recommendations</h2>
                      <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                        {analysis.recommendations.map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
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